"""
Performance & Load Testing Benchmark Suite for SETU-ROUTE.
Measures latency, throughput, and error rates across:
1. 100 Concurrent Dashboard Requests
2. 500 Simulated Vehicle GPS Telemetry Queries
3. 1,000 Spatial Incident & Road Filtering Requests
4. 50 Concurrent Multi-Criteria Route Optimization Graph Calculations
5. Idempotent Offline Sync Batch Submissions
"""

import asyncio
import time
import statistics
import uuid
from typing import List, Dict, Any, Callable
import httpx

BASE_URL = "http://localhost:8008"


async def benchmark_endpoint(
    client: httpx.AsyncClient,
    method: str,
    endpoint: str,
    payload_generator: Callable[[], Dict[str, Any]] = None,
    headers: Dict[str, str] = None,
    num_requests: int = 100,
    concurrency: int = 20
) -> Dict[str, Any]:
    latencies = []
    errors = 0
    start_time = time.perf_counter()

    semaphore = asyncio.Semaphore(concurrency)

    async def single_req():
        nonlocal errors
        async with semaphore:
            t0 = time.perf_counter()
            try:
                if method.upper() == "GET":
                    resp = await client.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=15.0)
                else:
                    data = payload_generator() if payload_generator else {}
                    resp = await client.post(f"{BASE_URL}{endpoint}", json=data, headers=headers, timeout=15.0)
                t1 = time.perf_counter()
                if resp.status_code in (200, 201):
                    latencies.append((t1 - t0) * 1000.0)  # ms
                else:
                    errors += 1
            except Exception as e:
                errors += 1

    tasks = [single_req() for _ in range(num_requests)]
    await asyncio.gather(*tasks)

    total_duration = time.perf_counter() - start_time

    if not latencies:
        return {
            "endpoint": endpoint,
            "method": method,
            "total_requests": num_requests,
            "concurrency": concurrency,
            "successful_requests": 0,
            "failed_requests": errors,
            "error_rate_percent": 100.0,
            "total_duration_sec": round(total_duration, 3),
            "throughput_rps": 0,
            "latency_min_ms": 0,
            "latency_p50_ms": 0,
            "latency_p95_ms": 0,
            "latency_p99_ms": 0,
            "latency_max_ms": 0,
            "latency_avg_ms": 0
        }

    latencies.sort()
    p50 = statistics.median(latencies)
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)] if len(latencies) >= 100 else latencies[-1]

    return {
        "endpoint": endpoint,
        "method": method,
        "total_requests": num_requests,
        "concurrency": concurrency,
        "successful_requests": len(latencies),
        "failed_requests": errors,
        "error_rate_percent": round((errors / num_requests) * 100.0, 2),
        "total_duration_sec": round(total_duration, 3),
        "throughput_rps": round(len(latencies) / total_duration, 1),
        "latency_min_ms": round(min(latencies), 2),
        "latency_p50_ms": round(p50, 2),
        "latency_p95_ms": round(p95, 2),
        "latency_p99_ms": round(p99, 2),
        "latency_max_ms": round(max(latencies), 2),
        "latency_avg_ms": round(statistics.mean(latencies), 2)
    }


async def run_load_test():
    print("=" * 75)
    print("SETU-ROUTE PRODUCTION PERFORMANCE & HIGH-CONCURRENCY LOAD BENCHMARK")
    print(f"Target Gateway: {BASE_URL}")
    print("=" * 75)

    async with httpx.AsyncClient(limits=httpx.Limits(max_connections=150, max_keepalive_connections=75)) as client:
        # Check API health first
        try:
            health = await client.get(f"{BASE_URL}/health", timeout=5.0)
            if health.status_code != 200:
                print(f"[!] Server not healthy: {health.status_code}")
                return
        except Exception as e:
            print(f"[!] Could not connect to {BASE_URL}: {e}")
            return

        # 1. Login to obtain JWT
        login_res = await client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": "admin@neroute.gov.in",
            "password": "admin123"
        })
        token = login_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"} if token else {}

        # 2. Get valid district ID
        dist_res = await client.get(f"{BASE_URL}/api/v1/districts")
        districts = dist_res.json()
        district_id = districts[0]["id"] if districts else "dist-01"

        benchmarks = []

        # Benchmark 1: 100 Concurrent Dashboard Summary Queries
        print("\n[*] Benchmark 1/5: 100 Concurrent Dashboard Summary Requests...")
        b1 = await benchmark_endpoint(client, "GET", "/api/v1/dashboard/summary", headers=headers, num_requests=100, concurrency=25)
        benchmarks.append(b1)
        print(f"    Throughput: {b1['throughput_rps']} req/s | P50: {b1['latency_p50_ms']}ms | P95: {b1['latency_p95_ms']}ms | Errors: {b1['failed_requests']}")

        # Benchmark 2: 500 GIS Map Features Telemetry Queries (Vehicles, Roads, Weather)
        print("\n[*] Benchmark 2/5: 500 GIS Map Feature & Telemetry Ingestion Requests...")
        b2 = await benchmark_endpoint(client, "GET", "/api/v1/map/features", headers=headers, num_requests=500, concurrency=50)
        benchmarks.append(b2)
        print(f"    Throughput: {b2['throughput_rps']} req/s | P50: {b2['latency_p50_ms']}ms | P95: {b2['latency_p95_ms']}ms | Errors: {b2['failed_requests']}")

        # Benchmark 3: 1,000 Spatial Incident & Road Segment Lookups
        print("\n[*] Benchmark 3/5: 1,000 Spatial Incident Filtering Lookups...")
        b3 = await benchmark_endpoint(client, "GET", "/api/v1/incidents", headers=headers, num_requests=1000, concurrency=50)
        benchmarks.append(b3)
        print(f"    Throughput: {b3['throughput_rps']} req/s | P50: {b3['latency_p50_ms']}ms | P95: {b3['latency_p95_ms']}ms | Errors: {b3['failed_requests']}")

        # Benchmark 4: 50 Multi-Criteria Route Optimization Calculations (Graph Solver)
        print("\n[*] Benchmark 4/5: 50 Concurrent Multi-Criteria Graph Routing Optimizations...")
        def make_route_payload():
            return {
                "origin_name": "Guwahati Terminal",
                "origin_lat": 26.1445,
                "origin_lng": 91.7362,
                "destination_name": "Silchar District Hospital",
                "dest_lat": 24.8333,
                "dest_lng": 92.7789,
                "vehicle_type": "Heavy Truck (16T)",
                "avoid_blocked_roads": True
            }
        b4 = await benchmark_endpoint(client, "POST", "/api/v1/routes/optimize", payload_generator=make_route_payload, headers=headers, num_requests=50, concurrency=10)
        benchmarks.append(b4)
        print(f"    Throughput: {b4['throughput_rps']} req/s | P50: {b4['latency_p50_ms']}ms | P95: {b4['latency_p95_ms']}ms | Errors: {b4['failed_requests']}")

        # Benchmark 5: 100 Idempotent Field Sync Queue Submissions
        print("\n[*] Benchmark 5/5: 100 Idempotent Field Offline Sync Submissions...")
        def make_sync_payload():
            return {
                "idempotency_key": f"bench-sync-{uuid.uuid4()}",
                "type": "landslide",
                "severity": "CRITICAL",
                "title": "High-Concurrency Benchmark Report",
                "description": "Validated through high concurrency queue",
                "latitude": 25.12,
                "longitude": 92.35,
                "district_id": district_id,
                "reporter_name": "Benchmark Agent",
                "reporter_role": "FIELD_OFFICER"
            }
        b5 = await benchmark_endpoint(client, "POST", "/api/v1/sync/upload", payload_generator=make_sync_payload, headers=headers, num_requests=100, concurrency=20)
        benchmarks.append(b5)
        print(f"    Throughput: {b5['throughput_rps']} req/s | P50: {b5['latency_p50_ms']}ms | P95: {b5['latency_p95_ms']}ms | Errors: {b5['failed_requests']}")

        print("\n" + "=" * 75)
        print("PERFORMANCE BENCHMARK SUMMARY TABLE")
        print("=" * 75)
        print(f"{'Endpoint':<32} | {'Reqs':<6} | {'RPS':<8} | {'P50 (ms)':<9} | {'P95 (ms)':<9} | {'Errors':<6}")
        print("-" * 75)
        for b in benchmarks:
            print(f"{b['endpoint']:<32} | {b['total_requests']:<6} | {b['throughput_rps']:<8} | {b['latency_p50_ms']:<9} | {b['latency_p95_ms']:<9} | {b['failed_requests']:<6}")
        print("=" * 75)


if __name__ == "__main__":
    asyncio.run(run_load_test())
