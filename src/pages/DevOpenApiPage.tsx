import React from "react";
import { Link } from "wouter";
import { LandingNavBar } from "../components/LandingNavBar";
import { Footer } from "../components/Footer";
import { MountainDivider } from "../components/MountainDivider";
import sketchChain from "../assets/sketch-step02-chain.jpg";


export default function DevOpenApiPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <LandingNavBar />
      <div>

        {/* Hero - dark */}
        <div className="border-b border-[#2A2A2A] relative overflow-hidden min-h-screen flex flex-col">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #2A2A2A 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <div className="max-w-[3200px] mx-auto px-8 md:px-16 pt-[20vh] pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 w-full">
            <div>
              <div className="inline-block font-['JetBrains_Mono'] text-[#FF6B00] text-xs tracking-[0.2em] uppercase border border-[#FF6B00]/30 px-3 py-1 mb-8">Developers</div>
              <h1 className="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">OpenAPI Spec</h1>
              <p className="text-[#888888] font-['Inter'] text-lg max-w-xl leading-relaxed mb-6">
                The OpenAPI 3.1 spec at <span className="font-['JetBrains_Mono'] text-white">lib/api-spec/openapi.yaml</span> is the single source of truth for all API contracts. Every type, every endpoint, every response schema flows from it.
              </p>
              <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">
                Orval reads the spec and generates React Query hooks, Zod validation schemas, and TypeScript types. Edit the spec once, regenerate, and every consumer is updated automatically.
              </p>
            </div>
            <div className="hidden md:block border border-[#1A1A1A] overflow-hidden">
              <img src={sketchChain} alt="Contract-first API chain diagram" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Post-hero white content */}
        <div className="relative z-10 bg-white text-[#0A0A0A]">
          <MountainDivider />

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Contract-first development</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">The spec comes before the implementation. No hand-written clients, no drift between server and frontend types.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E0E0E0]">
                {[
                  { step: "01", title: "Edit the spec", body: "Add or change an endpoint in lib/api-spec/openapi.yaml. Define the request body schema, path parameters, and response shape using JSON Schema within OpenAPI 3.1." },
                  { step: "02", title: "Run codegen", body: "Run pnpm --filter @workspace/api-spec run codegen. Orval reads the spec and writes React Query hooks and Zod schemas to lib/api-client/src/generated/." },
                  { step: "03", title: "Implement the route", body: "Add the Express route in artifacts/api-server/src/routes/. Use the generated Zod schema to validate inputs. The TypeScript type is guaranteed to match the spec." },
                ].map((item, i) => (
                  <div key={item.step} className={`p-10 ${i < 2 ? "border-r border-[#E0E0E0]" : ""}`}>
                    <div className="font-['JetBrains_Mono'] text-[#FF6B00] text-sm mb-4">{item.step}</div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-xl mb-4">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Generated output locations</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Codegen writes to <span className="font-['JetBrains_Mono']">lib/api-client/src/generated/</span>. Never edit these files by hand.</p>
              <div className="border border-[#E0E0E0] font-['JetBrains_Mono'] text-xs divide-y divide-[#E0E0E0]">
                {[
                  ["signito.ts", "React Query hooks for every endpoint. Import from @workspace/api-client-react."],
                  ["signito.zod.ts", "Zod schemas for request and response types. Use in Express route handlers for runtime validation."],
                  ["signito.schemas.ts", "TypeScript type definitions derived from the spec. Used as the shared contract between server and client."],
                  ["signito.msw.ts", "Mock Service Worker handlers for testing. Intercept API calls in unit and integration tests without a running server."],
                ].map(([file, desc]) => (
                  <div key={file} className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 px-6 py-4">
                    <span className="text-[#FF6B00]">{file}</span>
                    <span className="text-[#555555] font-['Inter'] text-xs leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#E0E0E0]">
            <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20">
              <h2 className="font-['Space_Grotesk'] text-3xl font-bold mb-4">Why OpenAPI over GraphQL or tRPC</h2>
              <p className="text-[#888888] font-['Inter'] text-sm mb-12 max-w-2xl">Signito is a protocol, not a product. The API needs to be consumable by any client in any language without depending on a JavaScript runtime.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Language-agnostic clients", body: "OpenAPI clients can be generated for Python, Go, Rust, or any language. A ZK prover written in Rust can call the relay endpoint without a JavaScript dependency." },
                  { title: "Standard tooling", body: "Swagger UI, Redoc, Postman, and Insomnia all import OpenAPI specs directly. No custom introspection query, no schema registry, no build step required to explore the API." },
                  { title: "Explicit contracts", body: "Every field is typed, required or optional status is explicit, and nullable vs undefined is distinguished. No implicit any, no runtime surprises from undocumented fields." },
                  { title: "Validation at both ends", body: "The Zod schemas generated from the spec validate inputs on the server and can validate responses on the client. If the spec is correct, both ends are correct by construction." },
                ].map((item) => (
                  <div key={item.title} className="border-2 border-[#0A0A0A] p-8">
                    <h3 className="font-['Space_Grotesk'] font-bold text-[#0A0A0A] text-lg mb-3">{item.title}</h3>
                    <p className="text-[#555555] font-['Inter'] text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-20 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold mb-2">Explore the full spec.</h2>
              <p className="text-[#888888] font-['Inter'] text-sm">The docs site renders the OpenAPI spec with interactive request examples.</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <a href="/docs/" className="btn-primary">Open Docs</a>
              <Link href="/developers/api-reference" className="btn-secondary">API Reference</Link>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
