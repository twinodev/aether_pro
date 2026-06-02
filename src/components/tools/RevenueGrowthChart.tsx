import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Event, Ticket } from "../../services/ticketService";
import { TrendingUp, BarChart3, HelpCircle, RefreshCw, Check } from "lucide-react";

interface RevenueGrowthChartProps {
  currentEvent: Event;
  eventTickets: Ticket[];
}

export default function RevenueGrowthChart({ currentEvent, eventTickets }: RevenueGrowthChartProps) {
  const [viewType, setViewType] = useState<"growth" | "tiers">("growth");
  const [filterConfirmed, setFilterConfirmed] = useState<boolean>(true);

  // 1. Filter tickets based on status
  const relevantTickets = useMemo(() => {
    return eventTickets.filter((t) => {
      if (filterConfirmed) {
        // Confirmed to be paid, or is free
        const isFree = t.price === "0" || !t.price || t.price.toLowerCase() === "free";
        return isFree || t.paymentConfirmed;
      }
      return true; // Show all registrations including pending
    });
  }, [eventTickets, filterConfirmed]);

  // 2. Extract unique tier names from current event or existing tickets as fallbacks
  const eventTiers = useMemo(() => {
    const tiersList: string[] = [];
    if (currentEvent.tiers && currentEvent.tiers.length > 0) {
      currentEvent.tiers.forEach((t) => {
        if (t.name && !tiersList.includes(t.name)) {
          tiersList.push(t.name);
        }
      });
    }
    // Backup: scan tickets in case the event tiers array is empty (e.g. standard ticketType fallback)
    relevantTickets.forEach((t) => {
      const type = t.ticketType || "General Admission";
      if (!tiersList.includes(type)) {
        tiersList.push(type);
      }
    });

    if (tiersList.length === 0) {
      tiersList.push(currentEvent.ticketType || "General Admission");
    }
    return tiersList;
  }, [currentEvent, relevantTickets]);

  // 3. Helper to parse timestamp safely
  const getTicketTime = (t: Ticket, index: number) => {
    if (!t.createdAt) {
      // Space them out slightly if timestamp is missing so they plot chronologically by sequence
      return Date.now() - 1000 * 60 * 15 * (relevantTickets.length - index);
    }
    if (typeof t.createdAt.toDate === "function") {
      return t.createdAt.toDate().getTime();
    }
    if (t.createdAt.seconds) {
      return t.createdAt.seconds * 1000;
    }
    if (typeof t.createdAt === "string") {
      const parsed = Date.parse(t.createdAt);
      return isNaN(parsed) ? (Date.now() - 1000 * 60 * 15 * (relevantTickets.length - index)) : parsed;
    }
    if (t.createdAt instanceof Date) {
      return t.createdAt.getTime();
    }
    return Date.now() - 1000 * 60 * 15 * (relevantTickets.length - index);
  };

  // 4. Organize chronological cumulative data
  const chartData = useMemo(() => {
    if (relevantTickets.length === 0) return [];

    // Sort tickets chronologically
    const sortedTickets = [...relevantTickets].sort((a, b) => {
      const idxA = relevantTickets.indexOf(a);
      const idxB = relevantTickets.indexOf(b);
      return getTicketTime(a, idxA) - getTicketTime(b, idxB);
    });

    // We'll keep a running sum per tier
    const runningSums: { [tier: string]: number } = {};
    eventTiers.forEach((tier) => {
      runningSums[tier] = 0;
    });

    return sortedTickets.map((ticket, index) => {
      const tierName = ticket.ticketType || "General Admission";
      const priceStr = String(ticket.price || "0").replace(/,/g, "");
      const ticketPrice = parseFloat(priceStr) || 0;

      // Update the running sum for this ticket's tier
      if (runningSums[tierName] !== undefined) {
        runningSums[tierName] += ticketPrice;
      } else {
        runningSums[tierName] = ticketPrice;
      }

      // Format timestamp to user friendly format
      const timestamp = getTicketTime(ticket, index);
      const dateObj = new Date(timestamp);
      const formattedTime = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      // Assemble data point
      const dataPoint: { [key: string]: any } = {
        name: formattedTime,
        sequence: `Tx #${index + 1}`
      };

      // Fill in current values for all tiers up to this transaction
      eventTiers.forEach((tier) => {
        dataPoint[tier] = runningSums[tier] || 0;
      });

      // Total cumulative at this point
      dataPoint.Total = Object.values(runningSums).reduce((sum, val) => sum + val, 0);

      return dataPoint;
    });
  }, [relevantTickets, eventTiers]);

  // 5. Total breakdown per tier for Bar Chart
  const tierDistributionData = useMemo(() => {
    const distribution: { [tier: string]: { revenue: number; volume: number } } = {};
    eventTiers.forEach((tier) => {
      distribution[tier] = { revenue: 0, volume: 0 };
    });

    relevantTickets.forEach((t) => {
      const tierName = t.ticketType || "General Admission";
      const priceStr = String(t.price || "0").replace(/,/g, "");
      const priceVal = parseFloat(priceStr) || 0;

      if (!distribution[tierName]) {
        distribution[tierName] = { revenue: 0, volume: 0 };
      }
      distribution[tierName].revenue += priceVal;
      distribution[tierName].volume += 1;
    });

    return Object.entries(distribution).map(([name, stats]) => ({
      name,
      Revenue: stats.revenue,
      TicketsSold: stats.volume
    }));
  }, [relevantTickets, eventTiers]);

  // Generate pleasant warm & custom palette representing modern premium look
  const getLineColor = (index: number) => {
    const colors = [
      "#6366f1", // Indigo
      "#10b981", // Emerald
      "#f59e0b", // Amber
      "#ec4899", // Pink
      "#3b82f6", // Blue
      "#8b5cf6", // Violet
    ];
    return colors[index % colors.length];
  };

  const totalEventRevenue = useMemo(() => {
    return relevantTickets.reduce((sum, t) => {
      const p = parseFloat(String(t.price || "0").replace(/,/g, "")) || 0;
      return sum + p;
    }, 0);
  }, [relevantTickets]);

  return (
    <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800">
              Financial Analysis & Growth
            </h4>
          </div>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">
            Revenue tracking across event ticket tiers
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Confirmed Filter toggle */}
          <button
            onClick={() => setFilterConfirmed(!filterConfirmed)}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-1
              ${filterConfirmed 
                ? "bg-indigo-50 border-indigo-100 text-indigo-600" 
                : "bg-neutral-50 border-neutral-100 text-neutral-500 hover:bg-neutral-100"}`}
          >
            <Check size={10} className={filterConfirmed ? "opacity-100" : "opacity-40"} />
            <span>Verified Paid Only</span>
          </button>

          {/* Tab switcher */}
          <div className="bg-neutral-50 rounded-xl p-1 flex border border-neutral-100">
            <button
              onClick={() => setViewType("growth")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
                ${viewType === "growth" 
                  ? "bg-white text-neutral-800 shadow-sm" 
                  : "text-neutral-400 hover:text-neutral-600"}`}
            >
              <TrendingUp size={12} />
              <span>Growth Timeline</span>
            </button>
            <button
              onClick={() => setViewType("tiers")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
                ${viewType === "tiers" 
                  ? "bg-white text-neutral-800 shadow-sm" 
                  : "text-neutral-400 hover:text-neutral-600"}`}
            >
              <BarChart3 size={12} />
              <span>Tier Comparison</span>
            </button>
          </div>
        </div>
      </div>

      {relevantTickets.length === 0 ? (
        <div className="border border-dashed border-neutral-200 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center gap-3 bg-neutral-50/50 min-h-[300px]">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-1 max-w-xs mx-auto">
            <h5 className="text-[11px] font-black uppercase text-neutral-800">No Revenue Data Yet</h5>
            <p className="text-[9px] text-neutral-400 font-medium uppercase leading-relaxed">
              Once attendees register and confirm payments, a chronological trajectory of your revenue growth will map here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary sub-strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-50/70 rounded-2xl border border-neutral-100">
            <div>
              <span className="text-[7.5px] font-black text-neutral-400 uppercase tracking-widest block">Total Tracked Revenue</span>
              <span className="text-sm font-black text-emerald-600 tracking-tight">
                UGX {totalEventRevenue.toLocaleString("en-US")}
              </span>
            </div>
            <div>
              <span className="text-[7.5px] font-black text-neutral-400 uppercase tracking-widest block">Tickets counted</span>
              <span className="text-sm font-black text-neutral-800">
                {relevantTickets.length} <span className="text-[10px] font-medium text-neutral-400">issued</span>
              </span>
            </div>
            <div>
              <span className="text-[7.5px] font-black text-neutral-400 uppercase tracking-widest block font-bold">Main Tier Segment</span>
              <span className="text-xs font-black text-indigo-600 uppercase truncate block">
                {tierDistributionData.sort((a,b) => b.Revenue - a.Revenue)[0]?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[7.5px] font-black text-neutral-400 uppercase tracking-widest block">Average Ticket Rev</span>
              <span className="text-xs font-black text-neutral-800">
                UGX {Math.round(totalEventRevenue / (relevantTickets.length || 1)).toLocaleString("en-US")}
              </span>
            </div>
          </div>

          <div className="h-72 w-full text-xs font-bold font-mono">
            {viewType === "growth" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    {eventTiers.map((tier, idx) => {
                      const color = getLineColor(idx);
                      return (
                        <linearGradient id={`grad-${idx}`} key={idx} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="sequence" 
                    stroke="#a3a3a3" 
                    fontSize={8}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis 
                    stroke="#a3a3a3" 
                    fontSize={8}
                    tickFormatter={(val) => `UGX ${val >= 1000 ? (val / 1000) + 'k' : val}`}
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#171717", 
                      borderRadius: "16px", 
                      border: "none", 
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    labelStyle={{ color: "#a3a3a3", marginBottom: "4px" }}
                    formatter={(value: any, name: string) => [
                      `UGX ${(parseFloat(String(value)) || 0).toLocaleString()}`, 
                      name.toUpperCase()
                    ]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}
                  />
                  {eventTiers.map((tier, idx) => (
                    <Area
                      key={idx}
                      type="monotone"
                      dataKey={tier}
                      name={tier}
                      stroke={getLineColor(idx)}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#grad-${idx})`}
                      stackId="tiers_stack"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tierDistributionData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#a3a3a3" 
                    fontSize={8}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis 
                    stroke="#a3a3a3" 
                    fontSize={8}
                    tickFormatter={(val) => `UGX ${val >= 1000 ? (val / 1000) + 'k' : val}`}
                    tickLine={false}
                    axisLine={false}
                    dx={-5}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#171717", 
                      borderRadius: "16px", 
                      border: "none", 
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: "bold"
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === "Revenue") return [`UGX ${(parseFloat(String(value)) || 0).toLocaleString()}`, "REVENUE"];
                      return [value, "TICKETS SOLD"];
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900 }}
                  />
                  <Bar 
                    dataKey="Revenue" 
                    name="Revenue Breakdown" 
                    fill="#6366f1" 
                    radius={[10, 10, 0, 0]} 
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
