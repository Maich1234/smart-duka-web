import api from '@/lib/api';
export type BookFormat = 'csv' | 'xlsx' | 'pdf';
export interface BookCatalogue { books: { key: string; title: string; description: string }[]; formats: BookFormat[]; currency: string; maxPeriodDays: number }
export interface BookDocument { title: string; period: { label: string }; columns: { key: string; label: string; align: 'left' | 'right'; type: string }[]; sections: { label?: string; rows: Record<string, string | number>[]; subtotals?: Record<string, number> }[]; totals: Record<string, number>; footnotes: string[]; meta: { estimated: boolean } }
export async function getBookCatalogue(): Promise<BookCatalogue> { return (await api.get('/reports/books')).data.data; }
export async function getBook(key:string, from:string, to:string): Promise<BookDocument> { return (await api.get(`/reports/books/${encodeURIComponent(key)}`,{params:{from,to}})).data.data; }
export async function downloadBook(key:string, format:BookFormat, from:string, to:string):Promise<void> {
 const response=await api.get(`/reports/books/${encodeURIComponent(key)}/download`,{params:{from,to,format},responseType:'blob'});
 const url=URL.createObjectURL(response.data);const a=document.createElement('a');a.href=url;a.download=`${key.replace(/[^a-z0-9-]/gi,'-')}-${from}-${to}.${format}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
