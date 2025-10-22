'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bill, BillItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Download, Save } from 'lucide-react';
import { toast } from 'sonner';
import loghiter from "../public/images/loghiter bakcground.png"

interface BillFormProps {
  bill: Bill | null;
  onClose: () => void;
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export default function BillForm({ bill, onClose }: BillFormProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit: 'pcs', rate: 0, amount: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bill) {
      setClientName(bill.client_name);
      setClientPhone(bill.client_phone);
      setClientAddress(bill.client_address);
      setBillDate(bill.bill_date);
      setNotes(bill.notes);
      fetchBillItems(bill.id);
    }
  }, [bill]);

  const fetchBillItems = async (billId: string) => {
    const { data, error } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', billId)
      .order('item_order');

    if (error) {
      console.error('Error fetching bill items:', error);
    } else if (data && data.length > 0) {
      setItems(
        data.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          rate: Number(item.rate),
          amount: Number(item.amount),
        }))
      );
    }
  };

  const calculateAmount = (quantity: number, rate: number) => {
    return quantity * rate;
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = calculateAmount(
        Number(newItems[index].quantity),
        Number(newItems[index].rate)
      );
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'pcs', rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter client name');
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      toast.error('Please fill all item descriptions');
      return;
    }

    setSaving(true);

    try {
      let billId = bill?.id;

      if (bill) {
        const { error: updateError } = await supabase
          .from('bills')
          .update({
            client_name: clientName,
            client_phone: clientPhone,
            client_address: clientAddress,
            bill_date: billDate,
            notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bill.id);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('bill_items')
          .delete()
          .eq('bill_id', bill.id);

        if (deleteError) throw deleteError;
      } else {
        const billNumber = await generateBillNumber();

        const { data: newBill, error: insertError } = await supabase
          .from('bills')
          .insert({
            bill_number: billNumber,
            client_name: clientName,
            client_phone: clientPhone,
            client_address: clientAddress,
            bill_date: billDate,
            notes: notes,
            total_amount: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        billId = newBill.id;
      }

      const itemsToInsert = items.map((item, index) => ({
        bill_id: billId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount,
        item_order: index,
      }));

      const { error: itemsError } = await supabase.from('bill_items').insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success(bill ? 'Bill updated successfully' : 'Bill created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const generateBillNumber = async () => {
    const { data, error } = await supabase.rpc('generate_bill_number');

    if (error || !data) {
      const timestamp = Date.now();
      return `BILL-${new Date().getFullYear()}-${timestamp}`;
    }

    return data;
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const total = getTotalAmount();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill?.bill_number || 'New Bill'}</title>
          <style>
            body {
             /* Important property to force background graphics printing */
    -webkit-print-color-adjust: exact; /* Chrome, Safari */
    print-color-adjust: exact; /* Standard property */
    
    /* Re-apply background for printing with !important to override defaults */
    background-image: url("/images/loghiter bakcground.png") !important;
    background-repeat: no-repeat !important;
    background-size: cover !important;
    background-position: center !important;
    
    /* Optional: Adjust padding for print */
    padding: 20px;
            }
            /* Add this block to force background printing */
            @media print {
              body {
                /* Important property to force background graphics printing */
                -webkit-print-color-adjust: exact; /* Chrome, Safari */
                print-color-adjust: exact; /* Standard property */
                
                /* Re-apply background for printing */
                background-image: url("/images/loghiter bakcground.png") !important;
                background-repeat: no-repeat !important;
                background-size: cover !important;
                background-position: center !important;
                
                /* Optional: Adjust padding for print */
                padding: 20px; 
              }
            }
            /* End of background printing fix */
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #1e293b;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #64748b;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-box {
              flex: 1;
            }
            .info-box h3 {
              margin: 0 0 10px 0;
              color: #1e293b;
              font-size: 14px;
              text-transform: uppercase;
            }
            .info-box p {
              margin: 5px 0;
              color: #475569;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #2563eb;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            tr:hover {
              background-color: #f8fafc;
            }
            .text-right {
              text-align: right;
            }
            .total-section {
              text-align: right;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
            }
            .total {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .notes {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8fafc;
              border-left: 4px solid #2563eb;
            }
            .notes h3 {
              margin: 0 0 10px 0;
              color: #1e293b;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #64748b;
              font-size: 12px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            
            /* Remove the unnecessary media print block you had previously */
            /* @media print {
              body {
                padding: 20px;
              }
            } */
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ELECTRICAL & PIPELINE SERVICES</h1>
            <p>Professional Billing Invoice</p>
          </div>

          <div class="info-section">
            <div class="info-box">
              <h3>Bill To:</h3>
              <p><strong>${clientName}</strong></p>
              ${clientPhone ? `<p>Phone: ${clientPhone}</p>` : ''}
              ${clientAddress ? `<p>Address: ${clientAddress}</p>` : ''}
            </div>
            <div class="info-box" style="text-align: right;">
              <h3>Bill Details:</h3>
              <p><strong>Bill No:</strong> ${bill?.bill_number || 'DRAFT'}</p>
              <p><strong>Date:</strong> ${new Date(billDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%;">Sr.</th>
                <th style="width: 40%;">Description</th>
                <th style="width: 15%;" class="text-right">Quantity</th>
                <th style="width: 10%;">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td>${item.unit}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          ${
            notes
              ? `
            <div class="notes">
              <h3>Notes / Terms & Conditions:</h3>
              <p>${notes.replace(/\n/g, '<br>')}</p>
            </div>
          `
              : ''
          }

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
    
        style={{
          backgroundImage: "url('/images/background.png')",
          backgroundBlendMode: 'lighten',
        }}
    >
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bills
          </Button>
          <div className="flex gap-2">
            {bill && (
              <Button onClick={handleDownloadPDF} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : bill ? 'Update Bill' : 'Save Bill'}
            </Button>
          </div>
        </div>

        <Card className='shadow-lg border border-orange-100 bg-white/90 backdrop-blur-md'>
          <CardHeader>
            <CardTitle>{bill ? `Edit Bill - ${bill.bill_number}` : 'Create New Bill'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                   className="pl-10 border-orange-200 focus:ring-orange-400"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="billDate">Bill Date</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={billDate}
                   className="pl-10 border-orange-200 focus:ring-orange-400"
                  onChange={(e) => setBillDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                   className="pl-10 border-orange-200 focus:ring-orange-400"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="clientAddress">Client Address</Label>
                <Input
                  id="clientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                   className="pl-10 border-orange-200 focus:ring-orange-400"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bill Items</h3>
                <Button onClick={addItem} size="sm" variant="outline"  className="pl-10 border-orange-200 focus:ring-orange-400">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="e.g., Wiring Installation"
                          className="pl-10 border-orange-200 focus:ring-orange-400"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                           className="pl-10 border-orange-200 focus:ring-orange-400"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          placeholder="pcs, m, hrs"
                           className="pl-10 border-orange-200 focus:ring-orange-400"
                        />
                      </div>
                     
                      <div className="md:col-span-2 flex items-end gap-2">
                        
                        {items.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 border-orange-200 focus:ring-orange-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes / Terms & Conditions</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or terms..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
