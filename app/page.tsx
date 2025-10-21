'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bill } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import BillForm from '@/components/bill-form';
import BillList from '@/components/bill-list';

export default function Home() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('bill_date', { ascending: false });

    if (error) {
      console.error('Error fetching bills:', error);
    } else {
      setBills(data || []);
      setFilteredBills(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBills(bills);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = bills.filter(
        (bill) =>
          bill.bill_number.toLowerCase().includes(query) ||
          bill.client_name.toLowerCase().includes(query) ||
          bill.client_phone.includes(query)
      );
      setFilteredBills(filtered);
    }
  }, [searchQuery, bills]);

  const handleCreateNew = () => {
    setEditingBill(null);
    setIsCreating(true);
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsCreating(true);
  };

  const handleClose = () => {
    setIsCreating(false);
    setEditingBill(null);
    fetchBills();
  };

  const handleDelete = async (billId: string) => {
    const { error } = await supabase.from('bills').delete().eq('id', billId);

    if (error) {
      console.error('Error deleting bill:', error);
    } else {
      fetchBills();
    }
  };

  if (isCreating) {
    return <BillForm bill={editingBill} onClose={handleClose} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Electrician Billing System
              </h1>
              <p className="text-slate-600">
                Manage your electrical and pipeline work invoices
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Bill
            </Button>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Bills
              </CardTitle>
              <CardDescription>
                Search and manage all your billing documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by bill number, client name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-slate-600">Loading bills...</p>
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-600 mb-4">
                    {searchQuery ? 'No bills found matching your search' : 'No bills created yet'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreateNew} variant="outline">
                      Create your first bill
                    </Button>
                  )}
                </div>
              ) : (
                <BillList
                  bills={filteredBills}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
