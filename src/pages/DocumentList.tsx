import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Document, DocumentTemplate, ImportBatch } from '../types';
import { Link } from 'react-router-dom';
import { Search, Eye, ShieldAlert, Trash2, FileBadge, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { getTemplateKeys, resolveTemplateValue } from '../utils';
import { ConfirmModal } from '../components/ConfirmModal';

type SortKey = 'status' | string;

type DynamicColumn = {
  key: string;
  label: string;
};

export function humanizeTemplateKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getDynamicColumns(template?: DocumentTemplate): DynamicColumn[] {
  return getTemplateKeys(template?.layout).map((key) => ({ key, label: humanizeTemplateKey(key) }));
}

export function getDynamicValue(document: Document, key: string): string {
  return resolveTemplateValue({ id: key, type: 'text', key, x: 0, y: 0, width: 0, height: 0, rotation: 0 }, document.dynamicData || {});
}

export function getDefaultTemplateId(templates: DocumentTemplate[], importBatches: ImportBatch[]): string {
  const activeTemplates = templates.filter((template) => template.status === 'ACTIVE');
  const activeTemplateIds = new Set(activeTemplates.map((template) => template.id));
  const recentImport = [...importBatches]
    .filter((batch) => batch.templateId && activeTemplateIds.has(batch.templateId))
    .sort((first, second) => (second.submittedAt || second.createdAt).localeCompare(first.submittedAt || first.createdAt))[0];
  if (recentImport?.templateId) return recentImport.templateId;
  return [...activeTemplates]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))[0]?.id || '';
}

export function DocumentList() {
  const [certs, setCerts] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REVOKED'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadCerts();
    storage.initTemplates().then((loadedTemplates) => {
      setTemplates(loadedTemplates);
      setTemplateId((currentTemplateId) => currentTemplateId || getDefaultTemplateId(loadedTemplates, storage.getImportBatches()));
    });
  }, []);

  const loadCerts = () => {
    setCerts(storage.getDocuments());
  };

  const handleRevoke = (id: string) => {
    setRevokeId(id);
  };

  const confirmRevoke = () => {
    if (!revokeId) return;
    try {
      storage.updateDocumentStatus(revokeId, 'REVOKED');
      loadCerts();
      setRevokeId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to revoke the document.');
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    try {
      storage.deleteDocument(deleteId);
      loadCerts();
      setDeleteId(null);
      setActionError('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete the document.');
    }
  };

  const selectedTemplate = templates.find((template) => template.id === templateId);
  const dynamicColumns = getDynamicColumns(selectedTemplate);

  const selectTemplate = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    setSearch('');
    setStatusFilter('ALL');
    setSortKey('status');
    setSortDirection('desc');
    setPage(1);
  };

  const changeSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(nextKey);
      setSortDirection(nextKey === 'status' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const templateCerts = certs.filter((document) => document.documentTemplateId === templateId);
  const filteredCerts = templateCerts.filter(c => {
    const searchValue = search.trim().toLowerCase();
    const matchesSearch = !searchValue || dynamicColumns.some((column) => getDynamicValue(c, column.key).toLowerCase().includes(searchValue));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCerts = [...filteredCerts].sort((first, second) => {
    const firstValue = sortKey === 'status' ? first.status : getDynamicValue(first, sortKey);
    const secondValue = sortKey === 'status' ? second.status : getDynamicValue(second, sortKey);
    const comparison = firstValue.localeCompare(secondValue, undefined, { numeric: true, sensitivity: 'base' });
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
      {revokeId && (
        <ConfirmModal
          title="Revoke document?"
          message="This action cannot be undone. The document will no longer be valid."
          confirmLabel="Revoke document"
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeId(null)}
        />
      )}
      {deleteId && (
        <ConfirmModal
          title="Delete document?"
          message="This action cannot be undone. The document and its approval records will be removed."
          confirmLabel="Delete document"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {actionError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}
      <div className="flex justify-end">
        <Link to="/import" className="inline-flex items-center gap-2 rounded-lg bg-[#0054a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#003f82]">
          <Upload className="h-4 w-4" /> Upload
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-gray-700 sm:min-w-64">
            <select
              value={templateId}
              onChange={(event) => selectTemplate(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select template</option>
              {templates.filter((template) => template.status === 'ACTIVE').map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </label>
          <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search visible document fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          </div>
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

      {!templateId ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
          <FileBadge className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>Select a template to view its documents.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {dynamicColumns.map((column) => (
                  <th key={column.key} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{sortButton(column.label, column.key)}</th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{sortButton('Status', 'status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={dynamicColumns.length + 2} className="px-6 py-12 text-center text-gray-500">
                    <FileBadge className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>{dynamicColumns.length ? 'No documents found for this template.' : 'This template has no dynamic fields.'}</p>
                  </td>
                </tr>
              ) : (
                visibleCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    {dynamicColumns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDynamicValue(cert, column.key) || '-'}</td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cert.status === 'VALID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link to={`/documents/${cert.id}`} className="text-[#0054a6] hover:text-[#003f82] flex items-center" title="View Detail">
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
                        <button
                          onClick={() => setDeleteId(cert.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </button>
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
      )}
    </div>
  );
}
