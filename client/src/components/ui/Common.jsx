export function StatusBadge({ status }) {
  const styles = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    cancelled: 'badge-cancelled',
    pledged: 'badge-pledged',
    received: 'bg-yellow-100 text-yellow-800 badge',
    verified: 'badge-verified',
    surplus: 'badge-surplus',
    fulfilled: 'badge-fulfilled',
    needed: 'badge-needed',
    draft: 'bg-gray-100 text-gray-600 badge',
    published: 'bg-green-100 text-green-700 badge',
  };

  return (
    <span className={styles[status] || 'badge bg-gray-100 text-gray-600'}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export function ProgressBar({ current, total, className = '' }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isSurplus = current > total;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-xs mb-1">
        <span>{current} / {total}</span>
        <span className={isSurplus ? 'text-purple-600 font-medium' : ''}>
          {isSurplus ? `${Math.round((current / total) * 100)}% (Surplus)` : `${Math.round(pct)}%`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            isSurplus ? 'bg-purple-500' : pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary-600`} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-xl ${sizes[size]} w-full p-6 z-10`}>
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, subtitle, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
