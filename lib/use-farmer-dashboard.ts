/**
 * Hook to load farmer dashboard data from API and merge with mock data.
 * Refetch when user performs actions (orders, inventory) so cards stay in sync.
 */

import useSWR from "swr"
import { useCallback, useMemo } from "react"
import { apiUrl, fetchWithAuth } from "@/lib/api"
import { mockData } from "@/lib/mockData"

type FarmerStats = typeof mockData.farmerStats

function mapOrderToRecent(order: {
  _id: string
  status?: string
  pricing?: { total?: number }
  orderNumber?: string
  items?: Array<{ product?: { name?: string }; productSnapshot?: { name?: string } }>
  buyer?: { profile?: { firstName?: string; lastName?: string } }
}) {
  const firstItem = order.items?.[0]
  const productName =
    firstItem?.productSnapshot?.name ?? firstItem?.product?.name ?? "Order"
  const buyer = order.buyer?.profile
  return {
    _id: order._id,
    status: order.status ?? "pending",
    total: order.pricing?.total ?? 0,
    totalAmount: order.pricing?.total ?? 0,
    orderNumber: order.orderNumber ?? order._id,
    items: order.items ?? [],
    products: [{ product: { name: productName } }],
    buyer: buyer
      ? {
          name: { first: buyer.firstName ?? "", last: buyer.lastName ?? "" },
          profile: { firstName: buyer.firstName, lastName: buyer.lastName },
        }
      : undefined,
    createdAt: (order as { createdAt?: string }).createdAt,
  }
}

export function useFarmerDashboardStats() {
  const fetcher = (url: string) => fetchWithAuth(url).then((r) => r.json())

  const { data: ordersData, mutate: mutateOrders } = useSWR(
    apiUrl("/orders?limit=5&sortBy=createdAt&sortOrder=desc"),
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 60000 }
  )

  const { data: statsData, mutate: mutateStats } = useSWR(
    apiUrl("/orders/stats"),
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 60000 }
  )

  const { data: productsData, mutate: mutateProducts } = useSWR(
    apiUrl("/products/farmer"),
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 60000 }
  )

  const mutate = useCallback(() => {
    mutateOrders()
    mutateStats()
    mutateProducts()
  }, [mutateOrders, mutateStats, mutateProducts])

  const stats: FarmerStats = useMemo(() => {
    const mock = mockData.farmerStats
    const ordersOk = ordersData?.success && Array.isArray(ordersData?.data?.orders)
    const statsOk = statsData?.success && statsData?.data?.stats
    const productsOk = productsData?.success && productsData?.data

    const orders = ordersOk ? ordersData.data.orders : []
    const orderStats = statsOk ? statsData.data.stats : null
    const products = productsOk ? productsData.data.products ?? [] : []
    const productStats = productsOk ? productsData.data.stats : null

    const recentOrders =
      orders.length > 0
        ? orders.map((o: Record<string, unknown>) => mapOrderToRecent(o as Parameters<typeof mapOrderToRecent>[0]))
        : mock.recentOrders

    const pendingCount =
      orderStats?.byStatus?.pending?.count ?? orderStats?.byStatus?.confirmed?.count ?? mock.pendingOrders
    const totalOrders = orderStats?.totalOrders ?? mock.totalOrders
    const totalRevenue = orderStats?.totalAmount ?? mock.totalRevenue

    const inventoryAlerts =
      Array.isArray(products) && products.length > 0
        ? products
            .filter(
              (p: { inventory?: { available?: number } }) =>
                (p.inventory?.available ?? 0) <= 10 && (p.inventory?.available ?? 0) > 0
            )
            .map((p: { _id: string; name?: string; inventory?: { available?: number } }) => ({
              _id: p._id,
              name: p.name ?? "Product",
              quantity: p.inventory?.available ?? 0,
              unit: "units",
            }))
        : mock.inventoryAlerts

    const totalProducts = productStats?.totalProducts ?? mock.totalProducts
    const activeProducts =
      Array.isArray(products) && products.length > 0
        ? products.filter((p: { status?: string }) => p.status === "active" || p.status === "available").length
        : mock.activeProducts
    const pendingProducts =
      Array.isArray(products) && products.length > 0
        ? products.filter((p: { status?: string }) => p.status === "pending").length
        : mock.pendingProducts

    return {
      ...mock,
      totalRevenue,
      totalOrders,
      pendingOrders: typeof pendingCount === "number" ? pendingCount : mock.pendingOrders,
      recentOrders,
      inventoryAlerts,
      totalProducts,
      activeProducts,
      pendingProducts,
    }
  }, [ordersData, statsData, productsData])

  const isLoading = !ordersData && !statsData && !productsData

  return { stats, isLoading, mutate }
}
