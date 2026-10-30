import { ImageResponse } from 'next/og';
export const alt = 'DuQana: sales, stock and M-Pesa for Kenyan shops';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function SocialImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#103D38', color: '#FAF8F1', padding: 64 }}>
      <div style={{ display: 'flex', fontSize: 44, fontWeight: 700 }}>DuQana<span style={{ color: '#D7B576' }}>.</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>Your shop, together.</div>
        <div style={{ fontSize: 32, color: '#D9E8DE' }}>Sales. Stock. M-Pesa. Your team.</div>
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: '#D7B576' }}>POS software for Kenyan shops</div>
    </div>, size,
  );
}
