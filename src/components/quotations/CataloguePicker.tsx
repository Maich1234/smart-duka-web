'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts, type Product } from '@/services/products';
import Button from '@/components/ui/Button';
export default function CataloguePicker({onSelect}:{onSelect:(p:Product)=>void}) {
 const [search,setSearch]=useState('');const [page,setPage]=useState(1);
 const query=useQuery({queryKey:['quotation-products',search,page],queryFn:()=>getProducts({search:search.trim()||undefined,page,limit:10})});
 return <div className="space-y-2 rounded-lg border border-slate-200 p-3"><label className="block text-sm">Find a product<input className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Name or barcode"/></label>{query.isPending?<p role="status">Loading products…</p>:query.isError?<p role="alert">Could not load products. <Button type="button" onClick={()=>query.refetch()}>Retry</Button></p>:<>{query.data.data.length?query.data.data.map(p=><button type="button" key={p._id} onClick={()=>onSelect(p)} className="flex w-full justify-between gap-2 border-b py-2 text-left text-sm hover:bg-slate-50"><span>{p.name}</span><span>{p.sellingPrice.toLocaleString()}</span></button>):<p className="text-sm text-slate-500">No matching products.</p>}<div className="flex items-center gap-3"><Button type="button" size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</Button><span className="text-xs">Page {page} of {Math.max(1,query.data.pagination?.pages??1)}</span><Button type="button" size="sm" variant="outline" disabled={page>=(query.data.pagination?.pages??1)} onClick={()=>setPage(p=>p+1)}>Next</Button></div></>}</div>;
}
