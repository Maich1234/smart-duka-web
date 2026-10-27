'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCustomers, type Customer } from '@/services/customers';
import Button from '@/components/ui/Button';
export default function CustomerPicker({selected,onSelect}:{selected:Customer|null;onSelect:(c:Customer|null)=>void}) {
 const [search,setSearch]=useState('');const [page,setPage]=useState(1);
 const q=useQuery({queryKey:['quotation-customers',search,page],queryFn:()=>getCustomers({search:search.trim()||undefined,page,limit:10}),enabled:!selected});
 if(selected)return <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 p-3"><span>{selected.name} {selected.phone&&`· ${selected.phone}`}</span><Button type="button" variant="ghost" onClick={()=>onSelect(null)}>Change</Button></div>;
 return <div className="space-y-2"><label className="block text-sm">Find a customer<input className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Name or phone"/></label>{q.isPending?<p>Loading customers…</p>:q.isError?<p role="alert">Could not load customers. <Button type="button" onClick={()=>q.refetch()}>Retry</Button></p>:<>{q.data.data.length?q.data.data.map(c=><button type="button" key={c._id} onClick={()=>onSelect(c)} className="block w-full border-b p-2 text-left text-sm hover:bg-slate-50">{c.name} {c.phone&&`· ${c.phone}`}</button>):<p className="text-sm text-slate-500">No customers found. Add a customer first.</p>}<div className="flex items-center gap-3"><Button type="button" size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</Button><span className="text-xs">Page {page} of {Math.max(1,q.data.pagination.pages)}</span><Button type="button" size="sm" variant="outline" disabled={page>=q.data.pagination.pages} onClick={()=>setPage(p=>p+1)}>Next</Button></div></>}</div>;
}
