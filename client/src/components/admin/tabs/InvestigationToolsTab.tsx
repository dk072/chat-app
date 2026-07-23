import React, { useState } from 'react';
import { Search, Download, FileText, Trash2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import api from '../../../services/api';

const InvestigationToolsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'deleted' | 'timeline'>('deleted');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedMessages, setDeletedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeletedMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/advanced/investigation/deleted?query=${searchQuery}`);
      setDeletedMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDeletedMessages();
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Search className="w-5 h-5 text-brand-500 shrink-0" />
            <span>Chat Investigation & Forensic Tools</span>
          </h2>
          <p className="text-xs text-slate-500">Deleted Message Audits, Conversation Timelines & Evidence Export</p>
        </div>

        <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('deleted')}
            className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'deleted' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Deleted Messages Audit
          </button>
        </div>
      </div>

      {activeSubTab === 'deleted' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Search Deleted & Modified Messages</span>
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search deleted messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-semibold pl-4">Sender</th>
                  <th className="pb-3 font-semibold">Content</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Deleted Status</th>
                  <th className="pb-3 font-semibold text-right pr-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {deletedMessages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No deleted messages found matching criteria.
                    </td>
                  </tr>
                ) : (
                  deletedMessages.map((m) => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pl-4 font-bold text-slate-800">{m.sender?.username}</td>
                      <td className="py-3 text-slate-600 max-w-xs truncate">{m.content || '[Media File]'}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold text-[10px]">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 font-bold rounded-md text-[10px]">
                          DELETED FOR EVERYONE
                        </span>
                      </td>
                      <td className="py-3 text-right pr-4 text-slate-400 font-mono">
                        {new Date(m.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationToolsTab;
