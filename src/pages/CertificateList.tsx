import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Certificate } from '../types';
import { Link } from 'react-router-dom';
import { Search, Eye, ShieldAlert, FileBadge, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils';

type SortKey = 'certificate' | 'recipient' | 'course' | 'issueDate' | 'status';

export function CertificateList() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('issueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadCerts();
  }, []);

  const loadCerts = () => {
    setCerts(storage.getCertificates());
  };

  const handleRevoke = (id: string) => {
    if (confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) {
      storage.updateCertificateStatus(id, 'REVOKED');
      loadCerts();
    }
  };

  const changeSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(nextKey);
      setSortDirection(nextKey === 'issueDate' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const filteredCerts = certs.filter(c => {
    const matchesSearch = c.recipientName.toLowerCase().includes(search.toLowerCase()) || 
                          c.id.toLowerCase().includes(search.toLowerCase()) ||
                          c.courseName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCerts = [...filteredCerts].sort((first, second) => {
    const values: Record<SortKey, [string, string]> = {
      certificate: [first.certificateNumber || first.id, second.certificateNumber || second.id],
      recipient: [first.recipientName, second.recipientName],
      course: [first.courseName, second.courseName],
      issueDate: [first.issueDate, second.issueDate],
      status: [first.status, second.status],
    };
    const [firstValue, secondValue] = values[sortKey];
    const comparison = sortKey === 'issueDate'
      ? new Date(firstValue).getTime() - new Date(secondValue).getTime()
      : firstValue.localeCompare(secondValue, undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  const totalPages = Math.max(1, Math.ceil(sortedCerts.length / pageSize));
  const visibleCerts = sortedCerts.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const sortButton = (label: string, key: SortKey) => (
    <button
      type="button"
      onClick={() => changeSort(key)}
      className="inline-flex items-center gap-1 text-left hover:text-blue-700"
    >
      {label}
      <ArrowUpDown className={`h-3.5 w-3.5 ${sortKey === key ? 'text-blue-600' : 'text-gray-400'}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by recipient, ID, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border"
          >
            <option value="ALL">All Status</option>
            <option value="VALID">Valid</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{sortButton('ID', 'certificate')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{sortButton('Recipient', 'recipient')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{sortButton('Course', 'course')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{sortButton('Issue Date', 'issueDate')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{sortButton('Status', 'status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileBadge className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>No certificates found.</p>
                  </td>
                </tr>
              ) : (
                visibleCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="font-mono tracking-wider">{cert.shortId || cert.id}</div>
                      <div className="text-xs text-gray-500">{cert.certificateNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cert.recipientName}</div>
                      <div className="text-sm text-gray-500">{cert.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cert.courseName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(cert.issueDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cert.status === 'VALID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link to={`/certificates/${cert.id}`} className="text-blue-600 hover:text-blue-900 flex items-center" title="View Detail">
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Link>
                        {cert.status === 'VALID' && (
                          <button 
                            onClick={() => handleRevoke(cert.id)} 
                            className="text-red-600 hover:text-red-900 flex items-center" title="Revoke"
                          >
                            <ShieldAlert className="w-4 h-4 mr-1" /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {sortedCerts.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedCerts.length)} of {sortedCerts.length}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                Per page
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </label>
              <span className="px-2">Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-md border border-gray-300 p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-md border border-gray-300 p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
