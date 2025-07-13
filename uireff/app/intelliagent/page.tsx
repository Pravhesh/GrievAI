"use client";

import InfraIntelliAgent from "@/components/InfraIntelliAgent";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, CheckCircle, Eye, Users, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { div } from "framer-motion/client";

type SortField = 'category' | 'count' | 'resolved' | 'avgResolutionTime' | 'priority';
type SortDirection = 'asc' | 'desc';

interface Complaint {
  id: string;
  description: string;
  status: string;
  priority: string;
  priorityLevel: number;
  reportedDate: string;
  lastUpdated: string;
  location: string;
  assignedTo: string | null;
  resolutionTime: number | null;
}

interface CategoryData {
  category: string;
  count: number;
  resolved: number;
  avgResolutionTime: number;
  priority: number;
  complaints: Complaint[];
}

interface Metrics {
  totalComplaints: number;
  resolved: number;
  pending: number;
  inProgress: number;
  unassigned: number;
  avgResolutionTime: number;
  responseTime: {
    avg: number;
    p90: number;
    p95: number;
  };
  byCategory: CategoryData[];
  byStatus: {
    [key: string]: number;
  };
  slaCompliance: number;
  citizenSatisfaction: number;
  lastUpdated: string;
}

// Metric Card Component
const MetricCard = ({ title, value, valueSuffix = "", trend, change, icon }: { 
  title: string; 
  value: string | number; 
  valueSuffix?: string;
  trend?: "up" | "down";
  change?: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-end mt-1">
          <span className="text-2xl font-bold">{value}</span>
          {valueSuffix && <span className="text-sm text-gray-500 ml-1">{valueSuffix}</span>}
        </div>
      </div>
      <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
        {icon}
      </div>
    </div>
    {change && (
      <p className={`mt-2 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </p>
    )}
  </div>
);

// Metric Item Component
const MetricItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default function IntelliAgentPage() {
  const [deploying, setDeploying] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'count',
    direction: 'desc',
  });

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedData = (data: CategoryData[]) => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const handleCategoryClick = (category: CategoryData) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  useEffect(() => {
    const deployAndFetch = async () => {
      try {
        // Trigger agent deployment
        await fetch("/api/agent/deploy", { method: "POST" });
        // Fetch sample data
        const res = await fetch("/api/agent/data");
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        setMetrics(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setDeploying(false);
      }
    };
    deployAndFetch();
  }, []);

  // Render complaint details view
  const renderComplaintsView = () => (
    <div className="space-y-6 w-full">
      <button 
        onClick={handleBackToCategories}
        className="flex items-center text-indigo-600 hover:underline mb-6"
      >
        ← Back to Categories
      </button>
      <h2 className="text-2xl font-bold text-gray-900">
        {selectedCategory?.category} Complaints
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({selectedCategory?.count} total, {selectedCategory?.resolved} resolved)
        </span>
      </h2>
      
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedCategory?.complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {complaint.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="line-clamp-2">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        complaint.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full mr-2" 
                        style={{
                          backgroundColor: 
                            complaint.priority === 'Low' ? '#10B981' :
                            complaint.priority === 'Medium' ? '#3B82F6' :
                            complaint.priority === 'High' ? '#F59E0B' :
                            complaint.priority === 'Critical' ? '#EF4444' :
                            '#8B5CF6'
                        }}
                      />
                      <span className="text-sm text-gray-900">{complaint.priority}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(complaint.reportedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {complaint.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render main categories view
  const renderCategoriesView = () => (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Test Data Analysis</h2>
        <Link href="/app" className="text-indigo-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Complaints" 
          value={metrics.totalComplaints} 
          trend="up"
          change="12% from last month"
          icon={<FileText className="h-6 w-6" />}
        />
        <MetricCard 
          title="Resolved" 
          value={metrics.resolved} 
          valueSuffix={`(${Math.round((metrics.resolved / metrics.totalComplaints) * 100)}%)`}
          trend="up"
          icon={<CheckCircle className="h-6 w-6 text-green-500" />}
        />
        <MetricCard 
          title="In Progress" 
          value={metrics.inProgress}
          trend="down"
          change="5% from last week"
          icon={<Eye className="h-6 w-6 text-blue-500" />}
        />
        <MetricCard 
          title="SLA Compliance" 
          value={`${metrics.slaCompliance}%`} 
          trend={metrics.slaCompliance > 85 ? "up" : "down"}
          icon={<Users className="h-6 w-6 text-purple-500" />}
        />
      </div>

      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('count')}
                >
                  <div className="flex items-center">
                    Total
                    {sortConfig.field === 'count' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('resolved')}
                >
                  <div className="flex items-center">
                    Resolved
                    {sortConfig.field === 'resolved' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgResolutionTime')}
                >
                  <div className="flex items-center">
                    Avg. Res. Time
                    {sortConfig.field === 'avgResolutionTime' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center">
                    Priority
                    {sortConfig.field === 'priority' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedData(metrics.byCategory).map((cat) => (
                <tr key={cat.category} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cat.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cat.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${cat.resolved/cat.count > 0.7 ? 'bg-green-100 text-green-800' : 
                        cat.resolved/cat.count > 0.4 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {cat.resolved} ({(cat.resolved/cat.count*100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cat.avgResolutionTime} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full mr-2" 
                        style={{
                          backgroundColor: 
                            cat.priority === 1 ? '#10B981' : // Green
                            cat.priority === 2 ? '#3B82F6' : // Blue
                            cat.priority === 3 ? '#F59E0B' : // Yellow
                            cat.priority === 4 ? '#EF4444' : // Red
                            '#8B5CF6' // Purple
                        }}
                      />
                      <span className="text-sm text-gray-500">
                        {['Low', 'Medium', 'High', 'Critical', 'Emergency'][cat.priority - 1]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleCategoryClick(cat)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Resolution Time</h3>
          <div className="space-y-2">
            <MetricItem label="Average" value={`${metrics.avgResolutionTime} days`} />
            <MetricItem label="Response Time (avg)" value={`${metrics.responseTime.avg} hours`} />
            <MetricItem label="90th Percentile" value={`${metrics.responseTime.p90} hours`} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-2">
            <MetricItem label="SLA Compliance" value={`${metrics.slaCompliance}%`} />
            <MetricItem label="Citizen Satisfaction" value={`${metrics.citizenSatisfaction}%`} />
            <MetricItem label="Rejection Rate" value={`${Math.round((metrics.byStatus.rejected / metrics.totalComplaints) * 100)}%`} />
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-right">
        Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center py-10 px-6">
      <div className="w-full max-w-5xl">
        {deploying && (
          <div className="flex justify-center my-10">
            <LoadingSpinner />
            <span className="ml-4 text-gray-700">Deploying InfraIntelliAgent...</span>
          </div>
        )}
        {!deploying && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            Failed to load agent data: {error}
          </div>
        )}
        {!deploying && metrics && (
          <>
            <InfraIntelliAgent />
            {selectedCategory ? renderComplaintsView() : renderCategoriesView()}
          </>
        )}
      </div>
    </div>
  );
}
