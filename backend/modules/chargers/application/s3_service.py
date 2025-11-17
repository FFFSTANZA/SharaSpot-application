"""AWS S3 service for photo storage and retrieval"""
import base64
import hashlib
import io
import logging
from datetime import datetime
from typing import Optional, Tuple
from uuid import uuid4

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for managing photo uploads to AWS S3"""

    def __init__(self):
        """Initialize S3 client"""
        self.s3_client = None
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}")

    def _validate_image(self, image_data: bytes) -> Tuple[bool, Optional[str]]:
        """
        Validate image data

        Args:
            image_data: Raw image bytes

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file size
        if len(image_data) > settings.S3_MAX_FILE_SIZE:
            return False, f"File size exceeds maximum of {settings.S3_MAX_FILE_SIZE / 1024 / 1024}MB"

        # Validate it's a real image using PIL
        try:
            image = Image.open(io.BytesIO(image_data))
            image.verify()

            # Check format
            if image.format.lower() not in ['jpeg', 'jpg', 'png', 'webp']:
                return False, f"Invalid image format: {image.format}. Allowed: JPEG, PNG, WEBP"

            return True, None
        except Exception as e:
            return False, f"Invalid image data: {str(e)}"

    def _optimize_image(self, image_data: bytes, max_width: int = 1920, quality: int = 85) -> bytes:
        """
        Optimize image by resizing and compressing

        Args:
            image_data: Raw image bytes
            max_width: Maximum width in pixels
            quality: JPEG quality (1-100)

        Returns:
            Optimized image bytes
        """
        try:
            image = Image.open(io.BytesIO(image_data))

            # Convert RGBA to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = background

            # Resize if needed
            if image.width > max_width:
                ratio = max_width / image.width
                new_height = int(image.height * ratio)
                image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)

            # Save optimized image
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            return output.getvalue()

        except Exception as e:
            logger.error(f"Failed to optimize image: {e}")
            return image_data  # Return original if optimization fails

    def _decode_base64_image(self, base64_string: str) -> Tuple[Optional[bytes], Optional[str]]:
        """
        Decode base64 image string

        Args:
            base64_string: Base64 encoded image (with or without data URI prefix)

        Returns:
            Tuple of (image_bytes, error_message)
        """
        try:
            # Remove data URI prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',', 1)[1]

            # Decode base64
            image_data = base64.b64decode(base64_string)
            return image_data, None

        except Exception as e:
            return None, f"Failed to decode base64 image: {str(e)}"

    def upload_photo(
        self,
        photo_data: str,
        prefix: str = settings.S3_PHOTO_PREFIX,
        optimize: bool = True
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Upload a photo to S3

        Args:
            photo_data: Base64 encoded image or raw bytes
            prefix: S3 key prefix (e.g., 'chargers/', 'verifications/')
            optimize: Whether to optimize the image before upload

        Returns:
            Tuple of (s3_url, error_message)
        """
        if not self.s3_client:
            return None, "S3 client not configured. Please set AWS credentials."

        try:
            # Decode base64 if needed
            if isinstance(photo_data, str):
                image_data, error = self._decode_base64_image(photo_data)
                if error:
                    return None, error
            else:
                image_data = photo_data

            # Validate image
            is_valid, error = self._validate_image(image_data)
            if not is_valid:
                return None, error

            # Optimize image if requested
            if optimize:
                image_data = self._optimize_image(image_data)

            # Generate unique key
            timestamp = datetime.utcnow().strftime('%Y%m%d')
            unique_id = uuid4().hex
            content_hash = hashlib.md5(image_data).hexdigest()[:8]
            key = f"{prefix}{timestamp}/{unique_id}_{content_hash}.jpg"

            # Upload to S3
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=image_data,
                ContentType='image/jpeg',
                CacheControl='public, max-age=31536000',  # Cache for 1 year
                Metadata={
                    'uploaded_at': datetime.utcnow().isoformat(),
                }
            )

            # Generate URL
            url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            logger.info(f"Successfully uploaded photo to S3: {url}")
            return url, None

        except (BotoCoreError, ClientError) as e:
            logger.error(f"S3 upload failed: {e}")
            return None, f"Failed to upload to S3: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {e}")
            return None, f"Upload failed: {str(e)}"

    def upload_multiple_photos(
        self,
        photos: list[str],
        prefix: str = settings.S3_PHOTO_PREFIX
    ) -> Tuple[list[str], list[str]]:
        """
        Upload multiple photos to S3

        Args:
            photos: List of base64 encoded images
            prefix: S3 key prefix

        Returns:
            Tuple of (successful_urls, error_messages)
        """
        urls = []
        errors = []

        for i, photo in enumerate(photos):
            url, error = self.upload_photo(photo, prefix=prefix)
            if url:
                urls.append(url)
            else:
                errors.append(f"Photo {i + 1}: {error}")

        return urls, errors

    def delete_photo(self, photo_url: str) -> Tuple[bool, Optional[str]]:
        """
        Delete a photo from S3

        Args:
            photo_url: Full S3 URL of the photo

        Returns:
            Tuple of (success, error_message)
        """
        if not self.s3_client:
            return False, "S3 client not configured"

        try:
            # Extract key from URL
            # URL format: https://bucket.s3.region.amazonaws.com/key
            if settings.S3_BUCKET_NAME not in photo_url:
                return False, "Invalid S3 URL"

            key = photo_url.split(f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[1]

            # Delete from S3
            self.s3_client.delete_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key
            )

            logger.info(f"Successfully deleted photo from S3: {photo_url}")
            return True, None

        except (BotoCoreError, ClientError) as e:
            logger.error(f"S3 deletion failed: {e}")
            return False, f"Failed to delete from S3: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error during S3 deletion: {e}")
            return False, f"Deletion failed: {str(e)}"

    def get_presigned_url(self, photo_url: str, expiration: int = None) -> Tuple[Optional[str], Optional[str]]:
        """
        Generate a presigned URL for temporary access to a private photo

        Args:
            photo_url: Full S3 URL of the photo
            expiration: URL expiration time in seconds (default from settings)

        Returns:
            Tuple of (presigned_url, error_message)
        """
        if not self.s3_client:
            return None, "S3 client not configured"

        try:
            # Extract key from URL
            if settings.S3_BUCKET_NAME not in photo_url:
                return None, "Invalid S3 URL"

            key = photo_url.split(f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/")[1]

            # Generate presigned URL
            expiration = expiration or settings.S3_PRESIGNED_URL_EXPIRATION
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': settings.S3_BUCKET_NAME,
                    'Key': key
                },
                ExpiresIn=expiration
            )

            return presigned_url, None

        except (BotoCoreError, ClientError) as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None, f"Failed to generate presigned URL: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL: {e}")
            return None, f"Presigned URL generation failed: {str(e)}"


# Global S3 service instance
s3_service = S3Service()
