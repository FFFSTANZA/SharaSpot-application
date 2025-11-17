"""Service for managing data scraping operations"""
import asyncio
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from uuid import uuid4
import os

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User
from ..schemas.scraping import (
    ScrapingJobResponse,
    ScrapingMetricsResponse,
    ScrapingMetricsSummary,
    ImportConfirmationResponse,
    ScrapingJobStatus
)


class ScrapingJobManager:
    """Manages scraping jobs and their state"""

    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.data_dir = Path(__file__).parent.parent.parent.parent / "data"
        self.processed_dir = self.data_dir / "processed"
        self.jobs_dir = self.processed_dir / "jobs"
        self.jobs_dir.mkdir(parents=True, exist_ok=True)

    def create_job(self, user: User, scrape_sources: Optional[List[str]] = None) -> str:
        """Create a new scraping job"""
        job_id = str(uuid4())

        self.jobs[job_id] = {
            'job_id': job_id,
            'user_id': user.id,
            'user_email': user.email,
            'status': 'pending',
            'progress': 0,
            'current_step': 'Initializing',
            'started_at': datetime.now(),
            'completed_at': None,
            'error': None,
            'metrics_available': False,
            'data_imported': False,
            'scrape_sources': scrape_sources,
            'data_file': None,
            'metrics_file': None,
        }

        # Save job to file
        self._save_job(job_id)

        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job details"""
        if job_id in self.jobs:
            return self.jobs[job_id]

        # Try to load from file
        job_file = self.jobs_dir / f"{job_id}.json"
        if job_file.exists():
            with open(job_file, 'r') as f:
                job_data = json.load(f)
                # Convert datetime strings back to datetime objects
                job_data['started_at'] = datetime.fromisoformat(job_data['started_at'])
                if job_data.get('completed_at'):
                    job_data['completed_at'] = datetime.fromisoformat(job_data['completed_at'])
                self.jobs[job_id] = job_data
                return job_data

        return None

    def update_job(self, job_id: str, **kwargs):
        """Update job status"""
        if job_id in self.jobs:
            self.jobs[job_id].update(kwargs)
            self._save_job(job_id)

    def _save_job(self, job_id: str):
        """Save job to file"""
        if job_id not in self.jobs:
            return

        job_data = self.jobs[job_id].copy()
        # Convert datetime objects to strings
        if isinstance(job_data.get('started_at'), datetime):
            job_data['started_at'] = job_data['started_at'].isoformat()
        if isinstance(job_data.get('completed_at'), datetime):
            job_data['completed_at'] = job_data['completed_at'].isoformat()

        job_file = self.jobs_dir / f"{job_id}.json"
        with open(job_file, 'w') as f:
            json.dump(job_data, f, indent=2, default=str)

    async def run_scraping(self, job_id: str):
        """Run the scraping process asynchronously"""
        try:
            job = self.get_job(job_id)
            if not job:
                return

            # Update status
            self.update_job(job_id, status='scraping', progress=10, current_step='Running scrapers')

            # Prepare job-specific output directory
            job_output_dir = self.processed_dir / f"job_{job_id}"
            job_output_dir.mkdir(parents=True, exist_ok=True)

            # Run scraping scripts
            scrape_sources = job.get('scrape_sources')

            if scrape_sources:
                # Run specific scrapers
                for i, source in enumerate(scrape_sources):
                    self.update_job(
                        job_id,
                        progress=10 + (i * 30 / len(scrape_sources)),
                        current_step=f'Scraping {source}'
                    )
                    await self._run_scraper(source, job_output_dir)
            else:
                # Run all scrapers using the orchestrator
                self.update_job(job_id, progress=20, current_step='Running all scrapers')
                await self._run_all_scrapers(job_output_dir)

            # Process data
            self.update_job(job_id, status='processing', progress=50, current_step='Processing and deduplicating data')
            processed_file = await self._process_data(job_output_dir)

            # Generate metrics
            self.update_job(job_id, status='analyzing', progress=80, current_step='Generating metrics')
            metrics_file = await self._generate_metrics(processed_file, job_output_dir)

            # Update job with results
            self.update_job(
                job_id,
                status='ready_for_review',
                progress=100,
                current_step='Ready for review',
                metrics_available=True,
                data_file=str(processed_file),
                metrics_file=str(metrics_file)
            )

        except Exception as e:
            self.update_job(
                job_id,
                status='failed',
                error=str(e),
                current_step='Failed',
                completed_at=datetime.now()
            )

    async def _run_scraper(self, source: str, output_dir: Path):
        """Run a specific scraper"""
        scraper_map = {
            'openstreetmap': 'scraper_openstreetmap.py',
            'open_charge_map': 'scraper_open_charge_map.py',
            'google_places': 'scraper_google_places.py',
            'here_maps': 'scraper_here_maps.py',
            'tomtom': 'scraper_tomtom.py',
            'charging_networks': 'scraper_charging_networks.py',
            'community_data': 'scraper_community_data.py',
            'public_data': 'scraper_public_data.py',
        }

        scraper_file = scraper_map.get(source)
        if not scraper_file:
            raise ValueError(f"Unknown scraper: {source}")

        scraper_path = self.data_dir / scraper_file
        if not scraper_path.exists():
            raise FileNotFoundError(f"Scraper not found: {scraper_path}")

        # Run scraper
        process = await asyncio.create_subprocess_exec(
            sys.executable, str(scraper_path),
            cwd=str(self.data_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            raise RuntimeError(f"Scraper failed: {stderr.decode()}")

    async def _run_all_scrapers(self, output_dir: Path):
        """Run all scrapers using the orchestrator"""
        orchestrator_path = self.data_dir / "run_data_collection.py"

        process = await asyncio.create_subprocess_exec(
            sys.executable, str(orchestrator_path), '--scrape-only',
            cwd=str(self.data_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            raise RuntimeError(f"Scraping failed: {stderr.decode()}")

    async def _process_data(self, output_dir: Path) -> Path:
        """Process and deduplicate scraped data"""
        processor_path = self.data_dir / "data_processor.py"

        # Output file for this job
        output_file = output_dir / "processed_chargers.json"

        process = await asyncio.create_subprocess_exec(
            sys.executable, str(processor_path),
            cwd=str(self.data_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            raise RuntimeError(f"Data processing failed: {stderr.decode()}")

        # Copy processed file to job directory
        default_processed = self.data_dir / "processed" / "processed_chargers.json"
        if default_processed.exists():
            import shutil
            shutil.copy(default_processed, output_file)

        return output_file

    async def _generate_metrics(self, data_file: Path, output_dir: Path) -> Path:
        """Generate metrics from processed data"""
        metrics_analyzer_path = self.data_dir / "metrics_analyzer.py"
        metrics_file = output_dir / "metrics.json"

        process = await asyncio.create_subprocess_exec(
            sys.executable, str(metrics_analyzer_path), str(data_file),
            cwd=str(self.data_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            raise RuntimeError(f"Metrics generation failed: {stderr.decode()}")

        # The analyzer should save metrics automatically
        # Copy to job directory if not already there
        default_metrics = self.data_dir / "processed" / "metrics.json"
        if default_metrics.exists() and not metrics_file.exists():
            import shutil
            shutil.copy(default_metrics, metrics_file)

        return metrics_file

    async def import_data(self, job_id: str, db: AsyncSession) -> ImportConfirmationResponse:
        """Import scraped data into the database"""
        job = self.get_job(job_id)
        if not job:
            raise ValueError("Job not found")

        if job['status'] != 'ready_for_review':
            raise ValueError("Job is not ready for import")

        try:
            self.update_job(job_id, status='importing', progress=0, current_step='Importing data')

            # Run database importer
            data_file = Path(job['data_file'])

            # Import via the db_importer script
            importer_path = self.data_dir / "db_importer.py"

            process = await asyncio.create_subprocess_exec(
                sys.executable, str(importer_path), str(data_file),
                cwd=str(self.data_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                raise RuntimeError(f"Import failed: {stderr.decode()}")

            # Parse import statistics from stdout
            output = stdout.decode()
            imported_count = 0
            skipped_count = 0
            error_count = 0

            # Try to extract numbers from output
            import re
            if match := re.search(r'imported:\s*(\d+)', output, re.IGNORECASE):
                imported_count = int(match.group(1))
            if match := re.search(r'skipped:\s*(\d+)', output, re.IGNORECASE):
                skipped_count = int(match.group(1))
            if match := re.search(r'error[s]?:\s*(\d+)', output, re.IGNORECASE):
                error_count = int(match.group(1))

            # Update job
            self.update_job(
                job_id,
                status='completed',
                progress=100,
                current_step='Import completed',
                data_imported=True,
                completed_at=datetime.now()
            )

            return ImportConfirmationResponse(
                job_id=job_id,
                status='completed',
                imported_count=imported_count,
                skipped_count=skipped_count,
                error_count=error_count,
                message=f"Successfully imported {imported_count} charging stations",
                completed_at=datetime.now()
            )

        except Exception as e:
            self.update_job(
                job_id,
                status='failed',
                error=str(e),
                completed_at=datetime.now()
            )
            raise


# Singleton instance
_job_manager = ScrapingJobManager()


async def start_scraping_job(
    user: User,
    scrape_sources: Optional[List[str]] = None
) -> ScrapingJobResponse:
    """Start a new scraping job"""
    job_id = _job_manager.create_job(user, scrape_sources)

    # Run scraping asynchronously
    asyncio.create_task(_job_manager.run_scraping(job_id))

    return ScrapingJobResponse(
        job_id=job_id,
        status='pending',
        message='Scraping job started. Data will be available for review before import.',
        started_at=datetime.now()
    )


async def get_scraping_status(job_id: str) -> Optional[ScrapingJobStatus]:
    """Get status of a scraping job"""
    job = _job_manager.get_job(job_id)
    if not job:
        return None

    return ScrapingJobStatus(**job)


async def get_scraping_metrics(job_id: str) -> Optional[ScrapingMetricsResponse]:
    """Get metrics for a scraping job"""
    job = _job_manager.get_job(job_id)
    if not job or not job.get('metrics_available'):
        return None

    metrics_file = Path(job['metrics_file'])
    if not metrics_file.exists():
        return None

    with open(metrics_file, 'r') as f:
        metrics = json.load(f)

    # Convert to response model
    return ScrapingMetricsResponse(
        job_id=job_id,
        summary=ScrapingMetricsSummary(**metrics['summary']),
        by_state=metrics['by_state'],
        by_source=metrics['by_source'],
        port_types=metrics['port_types'],
        port_combinations=metrics['port_combinations'],
        amenities=metrics['amenities'],
        operators=metrics['operators'],
        verification_distribution=metrics['verification_distribution'],
        data_quality=metrics['data_quality'],
        top_states=metrics['top_states'],
        top_operators=metrics['top_operators'],
        analysis_timestamp=metrics['analysis_timestamp']
    )


async def confirm_import(
    job_id: str,
    confirm: bool,
    notes: Optional[str],
    db: AsyncSession
) -> ImportConfirmationResponse:
    """Confirm and import scraped data, or cancel"""
    if not confirm:
        _job_manager.update_job(
            job_id,
            status='cancelled',
            current_step='Cancelled by user',
            completed_at=datetime.now()
        )
        return ImportConfirmationResponse(
            job_id=job_id,
            status='cancelled',
            imported_count=0,
            skipped_count=0,
            error_count=0,
            message='Import cancelled by user',
            completed_at=datetime.now()
        )

    # Import data
    return await _job_manager.import_data(job_id, db)


async def list_jobs(user: User, limit: int = 10) -> List[ScrapingJobStatus]:
    """List recent scraping jobs for a user"""
    jobs_dir = _job_manager.jobs_dir
    job_files = sorted(jobs_dir.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True)

    jobs = []
    for job_file in job_files[:limit]:
        with open(job_file, 'r') as f:
            job_data = json.load(f)
            if job_data.get('user_id') == user.id:
                # Convert datetime strings
                job_data['started_at'] = datetime.fromisoformat(job_data['started_at'])
                if job_data.get('completed_at'):
                    job_data['completed_at'] = datetime.fromisoformat(job_data['completed_at'])
                jobs.append(ScrapingJobStatus(**job_data))

    return jobs
