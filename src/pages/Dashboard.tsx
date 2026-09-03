import { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { Certificate, ImportRecord } from '../types';
import { FileBadge, Upload, ShieldCheck, ShieldAlert, History, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils';

export function Dashboard() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [imports, setImports] = useState<ImportRecord[]>([]);

  useEffect(() => {
    setCerts(storage.getCertificates());
    setImports(storage.getImports());
  }, []);

  const totalCerts = certs.length;
  const validCerts = certs.filter(c => c.status === 'VALID').length;
  const revokedCerts = certs.filter(c => c.status === 'REVOKED').length;
  const totalImportedRows = imports.reduce((acc, curr) => acc + curr.totalRows, 0);

  const recentCerts = certs.slice(0, 5);
  const recentImports = imports.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link 
          to="/import" 
          className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Excel
        </Link>
        <Link 
          to="/certificates" 
          className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <FileBadge className="w-4 h-4 mr-2" />
          View Certificates
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Certificates" value={totalCerts} icon={FileBadge} color="blue" />
        <StatCard title="Valid Certificates" value={validCerts} icon={ShieldCheck} color="green" />
        <StatCard title="Revoked" value={revokedCerts} icon={ShieldAlert} color="red" />
        <StatCard title="Total Imported Records" value={totalImportedRows} icon={History} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Certificates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Certificates</h3>
            <Link to="/certificates" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCerts.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No certificates found.</p>
            ) : (
              recentCerts.map(cert => (
                <div key={cert.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{cert.recipientName}</p>
                    <p className="text-sm text-gray-500">{cert.certificateTitle} &bull; {cert.id}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cert.status === 'VALID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {cert.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Imports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recent Imports</h3>
            <Link to="/imports" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentImports.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No imports found.</p>
            ) : (
              recentImports.map(imp => (
                <div key={imp.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{imp.fileName}</p>
                      <p className="text-sm text-gray-500">{formatDate(imp.importDate)}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {imp.successfulRows} / {imp.totalRows} success
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number | string, icon: any, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
      <div className={`p-3 rounded-lg ${colorMap[color]} mr-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
