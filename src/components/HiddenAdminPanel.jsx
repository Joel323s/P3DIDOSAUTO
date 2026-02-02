import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const HiddenAdminPanel = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const navigate = useNavigate();

    // Fetch users pending approval
    const fetchPendingUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('company_users')
                .select('*')
                .or('is_active.eq.false,subscription_status.eq.pending_approval')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingUsers(data || []);
        } catch (err) {
            console.error('Error fetching pending users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleApprove = async (userId) => {
        setActionLoading(userId);
        try {
            const { error } = await supabase
                .from('company_users')
                .update({
                    is_active: true,
                    subscription_status: 'active'
                })
                .eq('id', userId);

            if (error) throw error;

            // Remove from list
            setPendingUsers(pendingUsers.filter(u => u.id !== userId));
            alert('Usuario aprobado correctamente');
        } catch (err) {
            alert('Error al aprobar: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12 border-b border-gray-800 pb-4">
                    <h1 className="text-3xl font-bold text-red-500 tracking-widest uppercase">
                        Master Control // Approvals
                    </h1>
                    <button onClick={() => fetchPendingUsers()} className="text-sm bg-gray-900 px-4 py-2 rounded hover:bg-gray-800">Refresh</button>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 animate-pulse">Scanning database...</div>
                ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-20 border border-gray-800 rounded-lg border-dashed">
                        <p className="text-gray-500">No pending approval requests found.</p>
                        <p className="text-xs text-gray-700 mt-2">System Secure.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="bg-gray-900 border border-gray-800 p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-red-500/30 transition-all">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{user.business_name}</h3>
                                    <div className="space-y-1 text-sm text-gray-400">
                                        <p><span className="text-gray-600 uppercase text-xs w-20 inline-block">Owner:</span> {user.owner_name}</p>
                                        <p><span className="text-gray-600 uppercase text-xs w-20 inline-block">Email:</span> {user.email}</p>
                                        <p><span className="text-gray-600 uppercase text-xs w-20 inline-block">Phone:</span> {user.phone}</p>
                                        <p><span className="text-gray-600 uppercase text-xs w-20 inline-block">Access Code:</span> <span className="text-yellow-500 font-mono">{user.access_code}</span></p>
                                        <p><span className="text-gray-600 uppercase text-xs w-20 inline-block">Date:</span> {new Date(user.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleApprove(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded font-bold uppercase tracking-wider text-sm shadow-lg active:scale-95 disabled:opacity-50 min-w-[200px]"
                                >
                                    {actionLoading === user.id ? 'Processing...' : 'APPROVE ACCESS'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HiddenAdminPanel;
