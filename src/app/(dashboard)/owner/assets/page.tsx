'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssets, createAsset, updateAsset, ASSET_CATEGORY_LABELS, ASSET_STATUS_LABELS, type Asset, type CreateAssetData } from '@/services/assets';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function AssetsPage() {
 const [page,setPage]=useState(1); const [archived,setArchived]=useState(false);
 const [editing,setEditing]=useState<Asset|null|undefined>(); const [error,setError]=useState('');
 const client=useQueryClient(); const {showToast}=useToast();
 const query=useQuery({queryKey:['assets',page,archived],queryFn:()=>getAssets({page,limit:20,includeArchived:archived})});
 const mutation=useMutation({mutationFn:async({id,data}:{id?:string;data:CreateAssetData & {archived?:boolean}})=>id?updateAsset(id,data):createAsset(data),onSuccess:()=>{setEditing(undefined);setError('');client.invalidateQueries({queryKey:['assets']});showToast('Asset saved');},onError:(e:Error)=>setError(e.message || 'Could not save asset. Your form is retained.')});
 const field='w-full rounded-lg border border-gray-200 p-2 text-sm';
 return <div className="space-y-6 p-4 md:p-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Business assets</h1><p className="text-sm text-gray-500">Equipment, furniture and other things your shop owns.</p></div><Button onClick={()=>{setError('');setEditing(null);}}>Add asset</Button></header>
 <label className="flex gap-2 text-sm"><input type="checkbox" checked={archived} onChange={e=>{setArchived(e.target.checked);setPage(1);}}/>Include archived assets</label>
 {query.isPending?<p role="status">Loading assets…</p>:query.isError?<div role="alert">Could not load assets. <Button onClick={()=>query.refetch()}>Retry</Button></div>:<><div className="overflow-x-auto rounded-xl border border-gray-200 bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b bg-gray-50">{['Asset','Category','Quantity','Estimated value','Status','Actions'].map(x=><th key={x} className="p-4">{x}</th>)}</tr></thead><tbody>{query.data.data.map(a=><tr key={a._id} className="border-b last:border-0"><td className="p-4 font-medium">{a.name}{a.archivedAt&&' (archived)'}</td><td className="p-4">{ASSET_CATEGORY_LABELS[a.category]}</td><td className="p-4">{a.quantity}</td><td className="p-4 tabular-nums">{a.estimatedValue.toLocaleString()}</td><td className="p-4">{ASSET_STATUS_LABELS[a.status]}</td><td className="p-4"><Button variant="ghost" onClick={()=>{setError('');setEditing(a);}}>Edit</Button></td></tr>)}</tbody></table>{query.data.data.length===0&&<p className="p-8 text-center text-gray-500">No assets recorded.</p>}</div><div className="flex items-center gap-4"><Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</Button><span>Page {page} of {Math.max(1,query.data.pagination.pages)}</span><Button variant="outline" disabled={page>=query.data.pagination.pages} onClick={()=>setPage(p=>p+1)}>Next</Button></div></>}
 <Modal isOpen={editing!==undefined} title={editing?'Edit asset':'Add asset'} onClose={()=>{if(!mutation.isPending)setEditing(undefined);}}>{editing!==undefined&&<form key={editing?._id??'new'} className="space-y-4" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setError('');mutation.mutate({id:editing?._id,data:{name:String(f.get('name')),category:String(f.get('category')) as Asset['category'],acquisitionValue:Number(f.get('cost')),currentValue:f.get('value')===''?null:Number(f.get('value')),quantity:Number(f.get('quantity')),status:String(f.get('status')) as Asset['status'],notes:String(f.get('notes')),archived:f.get('archived')==='on'}});}}>
 <label className="block text-sm">Name<input required name="name" defaultValue={editing?.name} className={field}/></label>
 <label className="block text-sm">Category<select name="category" defaultValue={editing?.category??'equipment'} className={field}>{Object.entries(ASSET_CATEGORY_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <div className="grid grid-cols-2 gap-4"><label className="text-sm">Acquisition cost per unit<input required type="number" min="0" step="0.01" name="cost" defaultValue={editing?.acquisitionValue??0} className={field}/></label><label className="text-sm">Current value per unit (optional)<input type="number" min="0" step="0.01" name="value" defaultValue={editing?.currentValue??''} className={field}/></label></div>
 <label className="block text-sm">Quantity<input required type="number" min="1" step="1" name="quantity" defaultValue={editing?.quantity??1} className={field}/></label>
 <label className="block text-sm">Status<select name="status" defaultValue={editing?.status??'active'} className={field}>{Object.entries(ASSET_STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <label className="block text-sm">Notes<textarea name="notes" defaultValue={editing?.notes} className={field}/></label>
 {editing&&<label className="flex gap-2 text-sm"><input type="checkbox" name="archived" defaultChecked={!!editing.archivedAt}/>Archive this asset (retain its history)</label>}
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<Button type="submit" loading={mutation.isPending}>Save asset</Button>
 </form>}</Modal></div>;
}
