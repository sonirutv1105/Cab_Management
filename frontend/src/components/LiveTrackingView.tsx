/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCMS } from '../context/CMSContext';
import {
  Radio,
  MapPin,
  Car,
  Bell,
  CheckCircle,
  AlertCircle,
  Navigation,
  ShieldCheck,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';

export default function LiveTrackingView() {
  const { trips, drivers, vehicles, currentUser } = useCMS();
  
  const activeTrips = trips.filter(t => t.status === 'Ongoing' || t.status === 'Scheduled');
  const [selectedTripId, setSelectedTripId] = useState<string>(activeTrips[0]?.id || '');

  const activeTrip = activeTrips.find((t) => t.id === selectedTripId) || activeTrips[0];
  const driver = drivers.find((d) => d.id === activeTrip?.driverId);
  const vehicle = vehicles.find((v) => v.id === activeTrip?.vehicleId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300" id="live-tracking-panel">
      {/* LEFT COLUMN: ACTIVE TRIPS LIST */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-4 lg:col-span-1">
        <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
            <span>Active Trips ({activeTrips.length})</span>
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium font-semibold">List of trips currently tracked via GPS</p>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {activeTrips.map((trip) => {
            const d = drivers.find((drv) => drv.id === trip.driverId);
            const v = vehicles.find((vh) => vh.id === trip.vehicleId);
            const isSelected = selectedTripId === trip.id;

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedTripId(trip.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer duration-150 transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-200 dark:border-blue-800'
                    : 'border-gray-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/55'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100 uppercase">Trip ID: {trip.id}</span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        trip.status === 'Ongoing' ? 'bg-emerald-50 dark:bg-emerald-900/300 animate-ping' : 'bg-gray-400'
                      }`}
                      title={`Status is ${trip.status}`}
                    />
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1 font-semibold text-gray-600 dark:text-gray-400">
                  <div>Driver: <span className="font-bold text-gray-900 dark:text-gray-100">{d?.name || 'Unknown'}</span></div>
                  <div>Plate: <span className="font-mono text-gray-950 font-bold">{v?.plateNumber || 'N/A'}</span></div>
                </div>

                <div className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-semibold flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Destination: Unknown Route</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTRE COLUMN: MAP RENDERING / VISUAL TRACKING */}
      <div className="lg:col-span-2 bg-slate-900 rounded-3xl min-h-[400px] p-6 relative overflow-hidden text-white flex flex-col justify-between shadow-xl shadow-slate-950/20">
        {/* Dynamic telemetry background map SVG */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563eb" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Animated Road lines */}
            <path d="M 50,150 Q 150,50 350,150 T 650,250" fill="none" stroke="#1e40af" strokeWidth="8" strokeLinecap="round" />
            <path d="M 50,150 Q 150,50 350,150 T 650,250" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="10 15" strokeLinecap="round" />

            <path d="M 120,380 L 450,280 L 680,120" fill="none" stroke="#1e40af" strokeWidth="8" strokeLinecap="round" strokeDasharray="5" />
            
            {/* Satellite Beacon lines */}
            <circle cx="350" cy="150" r="12" fill="#ef4444" fillOpacity="0.3" className="animate-pulse" />
            <circle cx="350" cy="150" r="4" fill="#ef4444" />

            <circle cx="210" cy="95" r="10" fill="#3b82f6" fillOpacity="0.4" className="animate-ping" />
            <circle cx="210" cy="95" r="4" fill="#3b82f6" />
          </svg>
        </div>

        {/* TOP OVERLAYS */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/300/20 border border-emerald-500 text-emerald-400 font-extrabold text-[10px] uppercase">
              LIVE TRACKING
            </span>
            <h3 className="text-lg font-extrabold tracking-tight">Live Tracking Dashboard</h3>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-gray-500 font-bold bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 backdrop-blur-md">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>GPS CONNECTED</span>
          </div>
        </div>

        {/* CENTER TELEMETRY DATA PANEL */}
        {activeTrip ? (
          <div className="relative z-10 self-start bg-slate-950/80 border border-slate-800 backdrop-blur-md p-5 rounded-2xl max-w-sm mt-5 space-y-4">
            <div className="flex justify-between border-b border-slate-800 pb-2.5">
              <div>
                <p className="text-[10px] uppercase text-slate-400 dark:text-gray-500 font-bold">Inspecting</p>
                <p className="text-sm font-black text-white">Trip {activeTrip.id}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 dark:text-gray-500 font-bold text-right">Destination</p>
                <p className="text-xs text-blue-400 font-extrabold text-right">Unknown</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold text-slate-300">
              <div>
                <p className="text-[10px] text-slate-505 font-extrabold block">Driver Details</p>
                <span className="text-white text-xs font-bold leading-tight block mt-0.5">{driver?.name}</span>
                <span className="text-[10px] text-yellow-400 font-bold mt-1 block">Rating: ★ {driver?.rating.toFixed(1)}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-505 font-extrabold block">Vehicle Details</p>
                <span className="text-white text-xs font-bold leading-tight block mt-0.5">{vehicle?.plateNumber}</span>
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium block mt-1">{vehicle?.make} {vehicle?.model}</span>
              </div>
            </div>

            {/* Simulated Live Speeds telemetry */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
              <div>
                <span className="text-[9px] text-slate-500 dark:text-gray-400 font-extrabold block">LIVE SPEED</span>
                <span className="text-base font-black text-emerald-400 mt-0.5 block">54 <span className="text-[9px] font-normal">km/h</span></span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-gray-400 font-extrabold block">PASSENGERS</span>
                <span className="text-base font-black text-white mt-0.5 block">0 / {vehicle?.seatingCapacity || 5}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-gray-400 font-extrabold block">EST TIME</span>
                <span className="text-base font-black text-blue-400 mt-0.5 block">14 <span className="text-[9px] font-normal">min</span></span>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-gray-400 italic relative z-10">Select an active trip to view live tracking details</div>
        )}

        {/* BOTTOM METRIC BOX FOOTERS */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[9px] text-slate-505 block">EMERGENCY STATUS</p>
              <span className="text-white">Tier 1 Support Active</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 border-slate-800 md:border-l md:pl-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-[9px] text-slate-505 block">PANIC BUTTON ALERT</p>
              <span className="text-white">Live Alert Active</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 border-slate-800 md:border-l md:pl-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[9px] text-slate-505 block">REGULATORY STATUS</p>
              <span className="text-white">CTSA Registered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
