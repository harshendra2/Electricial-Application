'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bill } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Search, AlignJustify } from 'lucide-react';
import { Input } from '@/components/ui/input';
import BillForm from '@/components/bill-form';
import BillList from '@/components/bill-list';
import Image from 'next/image';
import twitterIcon from '../public/images/bhagavathi-bg-light.png';

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
    <div className="min-h-screen relative flex flex-col items-center bg-[#fdfaf7]">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/background.png')",
          backgroundBlendMode: 'lighten',
        }}
      />
      
      {/* Content */}
      <div
       className="relative z-10 container mx-auto px-4 py-10 max-w-6xl w-full">
        <div className="text-center mb-10">
          {/* Logo Section */}
          <div
            className="flex flex-col items-center gap-2"
         >
            <h1 className="text-4xl font-bold text-orange-50">
              Bhagavathi Electrical
            </h1>
            <p className="text-lg font-medium text-white tracking-wider">
              PROFESSIONAL WORKS
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-neutral-800 mt-10">
            Electrician Billing System
          </h2>
          <p className="text-white">
            Manage your electrical and pipeline work invoices efficiently
          </p>
        </div>

        <div className="flex justify-end mb-8">
          <Button
            onClick={handleCreateNew}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-md rounded-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Bill
          </Button>
        </div>

        <Card className="shadow-lg border border-orange-100 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-800">
              <FileText className="h-5 w-5 text-orange-500" />
              Recent Bills
            </CardTitle>
            <CardDescription className="text-neutral-600">
              Search and manage all your billing documents
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
              <Input
                placeholder="Search by bill number, client name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-orange-200 focus:ring-orange-400"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-4 text-neutral-600">Loading bills...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-orange-300 mb-4" />
                <p className="text-neutral-600 mb-4">
                  {searchQuery
                    ? 'No bills found matching your search'
                    : 'No bills created yet'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleCreateNew}
                    variant="outline"
                    className="border-orange-400 text-orange-500 hover:bg-orange-50"
                  >
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
  );
}