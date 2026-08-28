
import {
  Package,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  History,
} from "lucide-react";
import { useEffect, useState } from "react";

const DASHBOARD_URL = "http://localhost:4000/api/merchant/dashboard";

function MerchantPage() {
  const [dashboard, setDashboard] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      fetch(DASHBOARD_URL),
      fetch("http://localhost:4000/api/merchant/audit-logs"),
    ])
      .then(async ([dashboardResponse, auditResponse]) => {
        const dashboardData = await dashboardResponse.json();
        const auditData = await auditResponse.json();

        if (!dashboardResponse.ok || !dashboardData.success) {
          throw new Error(dashboardData.error || "Unable to load dashboard");
        }

        if (!auditResponse.ok || !auditData.success) {
          throw new Error(auditData.error || "Unable to load audit trail");
        }

        return { dashboardData, auditData };
      })
      .then(({ dashboardData, auditData }) => {
        if (isCurrent) {
          setDashboard(dashboardData);
          setAuditLogs(auditData.auditLogs || []);
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const stats = dashboard?.stats;
  const inventory = dashboard?.inventory || [];
  const campaigns = dashboard?.campaigns || [];
  const recentOrders = dashboard?.recentOrders || [];
  const topSearch = dashboard?.insights?.topSearches?.[0];

  const formatAuditAction = (action) =>
    action.replaceAll("_", " ").toLowerCase();

  const formatAuditDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="merchant-page">
      {/* HEADER */}
      <div className="merchant-header">
        <div>
          <h2>Merchant Dashboard</h2>
          <p>Commerce intelligence at a glance</p>
        </div>

        <div className="merchant-status">
          <span />
          Store Online
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="merchant-stats">
        <div className="merchant-stat-card">
          <div className="merchant-stat-icon">
            <Package size={20} />
          </div>

          <div>
            <span>Total Products</span>
            <strong>{stats?.totalProducts ?? "-"}</strong>
            <small>Products in catalog</small>
          </div>
        </div>

        <div className="merchant-stat-card">
          <div className="merchant-stat-icon">
            <ShoppingBag size={20} />
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{stats?.totalOrders ?? "-"}</strong>
            <small>Orders received</small>
          </div>
        </div>

        <div className="merchant-stat-card">
          <div className="merchant-stat-icon">
            <IndianRupee size={20} />
          </div>

          <div>
            <span>Revenue</span>
            <strong>
              {stats ? `₹${stats.revenue.toLocaleString("en-IN")}` : "-"}
            </strong>
            <small>Current revenue</small>
          </div>
        </div>

        <div className="merchant-stat-card warning-card">
          <div className="merchant-stat-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <span>Low Stock</span>
            <strong>{stats?.lowStock ?? "-"}</strong>
            <small>Products need attention</small>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="merchant-grid">
        {/* AI INSIGHTS */}
        <section className="merchant-panel ai-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Sparkles size={17} />
                <h3>AI Business Insights</h3>
              </div>

              <p>What your store activity is telling you</p>
            </div>

            <button className="panel-action">
              View all
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="insight-list">
            {topSearch && (
              <div className="insight-item">
                <div className="insight-icon">
                  <TrendingUp size={17} />
                </div>

                <div>
                  <strong>{topSearch.query} is trending</strong>
                  <p>{topSearch.count} customer searches recorded.</p>
                </div>
              </div>
            )}

            {stats && stats.lowStock > 0 && (
              <div className="insight-item">
                <div className="insight-icon">
                  <AlertTriangle size={17} />
                </div>

                <div>
                  <strong>Some products need restocking</strong>
                  <p>{stats.lowStock} products have five or fewer units left.</p>
                </div>
              </div>
            )}

            {dashboard?.insights?.funnel?.ordersCreated > 0 && (
              <div className="insight-item">
                <div className="insight-icon">
                  <ShoppingBag size={17} />
                </div>

                <div>
                  <strong>Orders are coming in</strong>
                  <p>{dashboard.insights.funnel.ordersCreated} orders created.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* AI CAMPAIGNS */}
        <section className="merchant-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Sparkles size={17} />
                <h3>Campaign Opportunities</h3>
              </div>

              <p>AI-generated opportunities</p>
            </div>
          </div>

          {campaigns.length === 0 && <p>No campaign opportunities yet.</p>}
          {campaigns.map((campaign) => (
            <div className="campaign-card" key={`${campaign.type}-${campaign.productId}`}>
              <span>{campaign.type.replaceAll("_", " ").toUpperCase()}</span>
              <h4>{campaign.productName}</h4>
              <p>{campaign.reason}</p>
              <button>
                {campaign.suggestedAction}
                <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </section>
      </div>

      {/* INVENTORY */}
      <section className="merchant-panel inventory-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <Package size={17} />
              <h3>Inventory Overview</h3>
            </div>

            <p>Products requiring attention</p>
          </div>

          <button className="panel-action">
            Manage inventory
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="inventory-table">
          <div className="inventory-row inventory-heading">
            <span>Product</span>
            <span>Category</span>
            <span>Stock</span>
            <span>Status</span>
          </div>

          {inventory.map((product) => (
            <div className="inventory-row" key={product._id}>
              <span className="product-name">{product.name}</span>
              <span>{product.category}</span>
              <span>{product.stock}</span>
              <span className={product.stock <= 5 ? "stock-low" : "stock-good"}>
                {product.stock <= 5 ? "Low stock" : "In stock"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ORDERS */}
      <section className="merchant-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <ShoppingBag size={17} />
              <h3>Recent Orders</h3>
            </div>

            <p>Latest customer purchases</p>
          </div>

          <button className="panel-action">
            View orders
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="orders-list">
          {recentOrders.map((order) => (
            <div className="order-row" key={order._id}>
              <div>
                <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                <span>{order.items?.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</span>
              </div>

              <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>

              <span className={`order-status ${order.status === "paid" ? "" : "pending"}`}>
                {order.status}
              </span>
            </div>
          ))}
          {!dashboard && !error && <p>Loading dashboard...</p>}
          {error && <p>{error}</p>}
          {dashboard && recentOrders.length === 0 && <p>No orders yet.</p>}
        </div>
      </section>

      {/* AUDIT TRAIL */}
      <section className="merchant-panel audit-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <History size={17} />
              <h3>Audit Trail</h3>
            </div>

            <p>Recent merchant and customer actions</p>
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <p>No audit activity yet.</p>
        ) : (
          <div className="audit-list">
            {auditLogs.map((log) => (
              <div className="audit-row" key={log._id}>
                <div className="audit-icon">
                  <History size={15} />
                </div>

                <div className="audit-details">
                  <strong>{formatAuditAction(log.action)}</strong>
                  <span>{log.entityType || "System activity"}</span>
                </div>

                <time dateTime={log.createdAt}>{formatAuditDate(log.createdAt)}</time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MerchantPage;


