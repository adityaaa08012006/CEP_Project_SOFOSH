import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { donationItemApi } from '../../api';
import { UNITS } from '@cep/shared';
import { LoadingSpinner, EmptyState } from '../../components/ui/Common';
import { Upload, FileText, Trash2, Check, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PdfUploadPage() {
  const [file, setFile] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [step, setStep] = useState('upload'); // upload | review | done
  const queryClient = useQueryClient();

  const { data: categoriesData } = useQuery({
    queryKey: ['donation-categories'],
    queryFn: () => donationItemApi.getCategories().then((r) => r.data),
  });

  const extractMut = useMutation({
    mutationFn: (formData) => donationItemApi.extractFromPdf(formData),
    onSuccess: (res) => {
      const items = res.data?.items || [];
      if (items.length === 0) {
        toast.error('No items could be extracted from this PDF. Try a different format.');
        return;
      }
      setExtractedItems(items.map((item, i) => ({ ...item, _id: i, _include: true })));
      setStep('review');
      toast.success(`${items.length} items extracted! Review before publishing.`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to parse PDF'),
  });

  const publishMut = useMutation({
    mutationFn: (payload) => donationItemApi.bulkCreate(payload),
    onSuccess: () => {
      toast.success('Items published successfully!');
      setStep('done');
      setExtractedItems([]);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['admin-donation-items'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to publish items'),
  });

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('pdf', file);
    extractMut.mutate(formData);
  };

  const updateItem = (id, field, value) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item._id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id) => {
    setExtractedItems((prev) => prev.filter((item) => item._id !== id));
  };

  const handlePublish = () => {
    const items = extractedItems
      .filter((item) => item._include)
      .map(({ _id, _include, confidence, ...rest }) => ({
        ...rest,
        quantity_needed: parseInt(rest.quantity_needed) || 1,
      }));

    if (items.length === 0) {
      toast.error('No items selected to publish');
      return;
    }

    publishMut.mutate({ items, batch_name: file?.name || 'PDF Upload' });
  };

  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PDF Upload & Extract</h1>
        <p className="text-gray-500">Upload a PDF containing needed items to automatically create donation listings</p>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="card max-w-2xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-10 h-10 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Upload PDF Document</h2>
              <p className="text-sm text-gray-500">
                The system will automatically extract item names, quantities, and units from your PDF.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            {file && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || extractMut.isPending}
              className="btn-primary px-8"
            >
              {extractMut.isPending ? 'Extracting...' : 'Extract Items'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {extractedItems.filter((i) => i._include).length} of {extractedItems.length} items selected
            </p>
            <div className="flex space-x-3">
              <button onClick={() => { setStep('upload'); setExtractedItems([]); }} className="btn-secondary text-sm">
                Re-upload
              </button>
              <button onClick={handlePublish} disabled={publishMut.isPending} className="btn-primary text-sm">
                <Check className="w-4 h-4 inline mr-1" />
                {publishMut.isPending ? 'Publishing...' : 'Publish Items'}
              </button>
            </div>
          </div>

          {extractedItems.length === 0 ? (
            <EmptyState icon={FileText} title="No Items" description="All items have been removed." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-semibold w-10">
                      <input
                        type="checkbox"
                        checked={extractedItems.every((i) => i._include)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setExtractedItems((prev) => prev.map((i) => ({ ...i, _include: val })));
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Quantity</th>
                    <th className="pb-3 font-semibold">Unit</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Confidence</th>
                    <th className="pb-3 font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {extractedItems.map((item) => (
                    <tr key={item._id} className={`hover:bg-gray-50 ${!item._include ? 'opacity-40' : ''}`}>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={item._include}
                          onChange={(e) => updateItem(item._id, '_include', e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item._id, 'name', e.target.value)}
                          className="input-field text-sm py-1"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity_needed}
                          onChange={(e) => updateItem(item._id, 'quantity_needed', e.target.value)}
                          className="input-field text-sm py-1 w-24"
                        />
                      </td>
                      <td className="py-2">
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item._id, 'unit', e.target.value)}
                          className="input-field text-sm py-1"
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="py-2">
                        <select
                          value={item.category || ''}
                          onChange={(e) => updateItem(item._id, 'category', e.target.value)}
                          className="input-field text-sm py-1"
                        >
                          <option value="">Auto-detect</option>
                          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2">
                        {item.confidence ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            item.confidence === 'high'
                              ? 'bg-green-100 text-green-700'
                              : item.confidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.confidence}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        <button onClick={() => removeItem(item._id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="card max-w-lg mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">Items Published!</h2>
          <p className="text-sm text-gray-500">
            The extracted items have been added to the donation list and are now visible to donors.
          </p>
          <button onClick={() => setStep('upload')} className="btn-primary">
            Upload Another PDF
          </button>
        </div>
      )}
    </div>
  );
}
