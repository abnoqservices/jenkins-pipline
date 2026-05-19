// components/LeadsManager.tsx
'use client';

import { useState, useEffect } from 'react';

type Lead = {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    company?: string;
    [key: string]: any; // allow custom lead properties
  };
  createdAt: string;
  updatedAt: string;
};

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    company: '',
    phone:'',
    // ← add more fields that exist in your leads object
  });

  // Fetch all leads
const fetchLeads = async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch('/api/hubspot/leads', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      let errorMsg = 'Failed to load leads';
      try {
        const errData = await res.json();
        errorMsg = errData.error || errorMsg;
      } catch {
        // If not JSON, use status text
        errorMsg = `${res.status} ${res.statusText}`;
      }

      if (res.status === 401) {
        errorMsg = 'Session expired. Please log in with HubSpot again.';
      } else if (res.status === 404) {
        errorMsg = 'Leads object not found (404). Is the Leads object enabled in your HubSpot account? Try using Contacts instead.';
      } else if (res.status === 403) {
        errorMsg = 'Permission denied (403). Check scopes or app authorization.';
      }

      setError(errorMsg);
      setLeads([]);
      return;
    }

    const data = await res.json();
    setLeads(data.results || []);
  } catch (err: any) {
    console.error('Fetch error:', err);
    setError(
      err.message?.includes('Failed to fetch')
        ? 'Network or CORS issue — check browser console and API route.'
        : 'Unexpected error: ' + (err.message || 'Unknown')
    );
  } finally {
    setLoading(false);
  }
};

  // Create new lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email?.trim()) {
      setError('Email is required');
      return;
    }

    try {
      const res = await fetch('/api/hubspot/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            firstname: formData.firstname.trim() || undefined,
            lastname: formData.lastname.trim() || undefined,
            email: formData.email.trim(),
            company: formData.company.trim() || undefined,
            phone:formData.phone.trim() || undefined,
            // lifecycle stage, deal stage, etc. — add if needed
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create lead');
      }

      // Reset form
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        company: '',
        phone:'',
      });

      // Refresh list
      await fetchLeads();
      alert('Lead created successfully!');
    } catch (err: any) {
      setError(err.message || 'Error creating lead');
    }
  };

  // Load leads when component mounts
  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="border border-gray-300 rounded-lg p-6 mt-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leads Manager</h2>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Refreshing...' : 'Refresh Leads'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
          {error}
        </div>
      )}

      {leads.length === 0 && !loading ? (
        <p className="text-gray-500 italic">No leads found. Create one below.</p>
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.properties.firstname} {lead.properties.lastname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.properties.email || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.properties.company || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.properties.phone || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Create New Lead</h3>

        <form onSubmit={handleCreateLead} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={formData.firstname}
              onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={formData.lastname}
              onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}