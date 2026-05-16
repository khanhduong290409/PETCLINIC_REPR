import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { ShoppingBag, CalendarDays, Users, TrendingUp } from 'lucide-react';
import { adminApi, type DashboardData, type DailyRevenue } from '../../api/adminApi';
import { useToast } from '../../contexts/ToastContext';

// ---- màu sắc & nhãn ----
const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};
const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  SHIPPED: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

const APPT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};
const APPT_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

// ---- helpers ----
function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + '₫';
}

//viet tat so tien  
function shortCurrency(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toString();
}

function formatDateLabel(dateStr: string) {
  // "2026-05-07" → "07/05"  |  "2026-05" → "T5/26"  |  "2026-Q2" → "Q2/26"  |  "2026" → "2026"
  if (dateStr.includes('Q')) {
    const [year, q] = dateStr.split('-');
    return `${q}/${year.slice(2)}`;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  if (parts.length === 2) return `T${parseInt(parts[1])}/${parts[0].slice(2)}`;
  return dateStr;
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5);
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(dateTimeStr: string) {
  const d = new Date(dateTimeStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}//"2026-05-09T14:30:25"  →  "09/05/2026, 14:30"

// ---- KPI Card ----
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}
function KpiCard({ icon, label, value, sub, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---- custom tooltip cho line chart ---- MODAL HIEN THI KHI HOVER VAO LINE DO THI DOANH THU
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-semibold text-sky-700">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ---- custom tooltip cho bar chart ----
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
      <p className="text-gray-500 mb-0.5 truncate max-w-[180px]">{label}</p>
      <p className="font-semibold text-gray-800">{payload[0].value} sản phẩm</p>
    </div>
  );
}

type Period = 'day' | 'month' | 'quarter' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  day: '30 ngày',
  month: '12 tháng',
  quarter: '8 quý',
  year: 'Theo năm',
};

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState<Period>('day');
  const [revenueChartData, setRevenueChartData] = useState<DailyRevenue[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);

  useEffect(() => {
    adminApi.getDashboard()
      .then((d) => {
        setData(d);
        setRevenueChartData(d.revenueByDay);
      })
      .catch(() => showToast('Không thể tải dữ liệu dashboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Không gọi lại lần đầu (period=day đã có từ getDashboard)
    if (loading) return;
    setRevenueLoading(true);
    adminApi.getRevenue(period) // doanh thu theo từng period
      .then(setRevenueChartData)
      .catch(() => showToast('Không thể tải dữ liệu doanh thu', 'error'))
      .finally(() => setRevenueLoading(false));
  }, [period]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Đang tải dữ liệu...</div>;
  }
  if (!data) return null;

  // chuẩn bị dữ liệu cho biểu đồ
  const revenueData = revenueChartData.map((d) => ({
    date: formatDateLabel(d.date),
    revenue: Number(d.revenue),
  }));

  const orderPieData = data.orderStatusCounts
    .filter((s) => s.count > 0)
    .map((s) => ({ name: ORDER_STATUS_LABEL[s.status] ?? s.status, value: s.count, status: s.status }));

  const apptBarData = data.appointmentStatusCounts.map((s) => ({
    name: APPT_STATUS_LABEL[s.status] ?? s.status,
    count: s.count,
    status: s.status,
  }));

  const topProductsData = [...data.topProducts].reverse(); // ascending để bar dài nhất ở trên

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp size={22} className="text-green-600" />}
          label="Doanh thu tháng này"
          value={shortCurrency(Number(data.revenueThisMonth))}
          sub={formatCurrency(Number(data.revenueThisMonth))}
          color="bg-green-50"
        />
        <KpiCard
          icon={<ShoppingBag size={22} className="text-sky-600" />}
          label="Tổng đơn hàng"
          value={data.totalOrders.toString()}
          sub={data.todayOrders > 0 ? `+${data.todayOrders} đơn hôm nay` : 'Hôm nay chưa có đơn'}
          color="bg-sky-50"
        />
        <KpiCard
          icon={<CalendarDays size={22} className="text-purple-600" />}
          label="Tổng lịch khám"
          value={data.totalAppointments.toString()}
          sub={data.todayAppointments > 0 ? `${data.todayAppointments} lịch hôm nay` : 'Hôm nay không có lịch'}
          color="bg-purple-50"
        />
        <KpiCard
          icon={<Users size={22} className="text-orange-600" />}
          label="Khách hàng"
          value={data.totalCustomers.toString()}
          color="bg-orange-50"
        />
      </div>

      {/* Row 2: Line chart + Donut chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Doanh thu theo period */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Doanh thu</p>
            <div className="flex gap-1">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    period === p ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          {revenueLoading ? (
            <div className="flex items-center justify-center h-[220px] text-gray-300 text-sm">Đang tải...</div>
          ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11 }} width={48} />
              <Tooltip content={<RevenueTooltip />} /> 
              {/* Khi hover chuột vào chart, Recharts tự động hiện popup. Mặc định popup trông xấu — nên dùng content để thay bằng component tự viết. */}
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
        {/* đã đọc tới đây */}


        {/* Phân bổ trạng thái đơn hàng */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Trạng thái đơn hàng</p>
          {orderPieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-300 text-sm">Chưa có đơn hàng</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {orderPieData.map((entry) => (
                    <Cell key={entry.status} fill={ORDER_STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                  ))}
                  {/* cơ chế của pie: nhận data và datakey, nếu trong pie ta không tạo Cell thì pie nó sẽ tạo các cell mặc định bằng datakey với data
                  còn nếu ta tạo cell trong pie thì nó sẽ dùng cái cell đó lun nhưng mà value thì vẫn là của pie được nhận
                  trong trường hợp ta tạo nhiều cell hơn số lượng trong data thì nó sẽ chỉ vẽ đủ số lượng cell và các data dư thừa đi  */}
                </Pie>
                {/* <Tooltip formatter={(val: number) => [`${val} đơn`, '']} /> */}
                <Tooltip formatter={(val) => [`${val} đơn`, 'tổng']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Top products + Appointment status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 sản phẩm bán chạy */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Top 5 sản phẩm bán chạy</p>
          {topProductsData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-300 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={topProductsData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tick={{ fontSize: 10 }}
                  width={110}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="totalQuantity" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lịch khám theo trạng thái */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Lịch khám theo trạng thái</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={apptBarData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              {/* <Tooltip formatter={(val: number) => [`${val} lịch`, '']} /> */} 
              {/* đoạn này nếu để như cũ sẽ bị lỗi typeScript vì tooltip nhận val kiểu valuetype|undefined (tức là kiểu number, string, array | undefined) 
              nên khi ép val kiểu number ( ko đầy đủ ) nên báo lỗi, nên ta không ép kiểu mà dùng thẳng để typescript định nghĩa đúng type value   */}
              <Tooltip formatter ={(val) => [`${val} lịch`, '']}/>
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {apptBarData.map((entry) => (
                  <Cell key={entry.status} fill={APPT_STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Recent orders + Upcoming appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 5 đơn hàng mới nhất */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Đơn hàng mới nhất</p>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-8">Chưa có đơn hàng</p>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map((o) => (
                <div key={o.orderNumber} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-mono font-medium text-gray-800">{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">{o.userName} · {formatDateTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(o.totalAmount)}</p>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: (ORDER_STATUS_COLORS[o.status] ?? '#94a3b8') + '20',
                        color: ORDER_STATUS_COLORS[o.status] ?? '#94a3b8',
                      }}
                    >
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5 lịch khám sắp tới */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Lịch khám sắp tới</p>
          {data.upcomingAppointments.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-8">Không có lịch khám sắp tới</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingAppointments.map((a) => (
                <div key={a.bookingCode} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.petName} <span className="text-gray-400 font-normal">· {a.ownerName}</span></p>
                    <p className="text-xs text-gray-400">{formatDate(a.appointmentDate)} lúc {formatTime(a.appointmentTime)}</p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: (APPT_STATUS_COLORS[a.status] ?? '#94a3b8') + '20',
                      color: APPT_STATUS_COLORS[a.status] ?? '#94a3b8',
                    }}
                  >
                    {APPT_STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
