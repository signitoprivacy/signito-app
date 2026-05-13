import React, { useEffect, useState } from "react";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import {
  useGetStatus,
  useHealthCheck,
  getGetStatusQueryKey,
  getHealthCheckQueryKey,
} from "@workspace/api-client-react";

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const { data: statusData, refetch: refetchStatus } = useGetStatus({ query: { queryKey: getGetStatusQueryKey(), refetchInterval: 30000 } });
  const { data: healthData, refetch: refetchHealth } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 30000 } });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchStatus();
      refetchHealth();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchStatus, refetchHealth]);

  const allOk = statusData?.checks.every(c => c.status === "ok") && healthData?.status === "ok";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      <LandingNavBar />
      
      <main className="pt-32 pb-20">
        <div className="max-w-[3200px] mx-auto px-8 md:px-16">
          
          <div className="mb-12">
            <h1 className="font-['Space_Grotesk'] text-4xl font-bold mb-4">
              {allOk ? "All systems operational" : "Partial outage detected"}
            </h1>
            <p className="text-[#888888]">Real-time status of Signito protocol infrastructure.</p>
          </div>

          <div className="card mb-8">
            <div className="space-y-6">
              
              {/* Signito API */}
              <div className="flex items-center justify-between pb-6 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${healthData?.status === 'ok' ? 'bg-[#FF6B00]' : 'bg-[#888888]'}`}></div>
                  <span className="font-['Space_Grotesk'] font-medium">Signito API</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">12ms</span>
                  <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-wider">
                    {healthData?.status === 'ok' ? 'OPERATIONAL' : 'CHECKING'}
                  </span>
                </div>
              </div>

              {/* Other Checks */}
              {statusData?.checks.map((check, i) => (
                <div key={check.name} className={`flex items-center justify-between ${i !== statusData.checks.length - 1 ? 'pb-6 border-b border-[#2A2A2A]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${check.status === 'ok' ? 'bg-[#FF6B00]' : 'bg-[#888888]'}`}></div>
                    <span className="font-['Space_Grotesk'] font-medium">{check.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-['JetBrains_Mono'] text-xs text-[#888888]">{check.latency}ms</span>
                    <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-wider">
                      {check.status === 'ok' ? 'OPERATIONAL' : 'ERROR'}
                    </span>
                  </div>
                </div>
              ))}

            </div>
          </div>

          <p className="text-[#888888] font-['JetBrains_Mono'] text-xs text-right">
            Last checked: {lastUpdated.toLocaleTimeString()}
          </p>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
