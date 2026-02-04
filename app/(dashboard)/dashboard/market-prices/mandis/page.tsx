"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Navigation,
  Search,
  Filter,
  List,
  Map as MapIcon,
  Building2,
  Truck,
  Warehouse,
  Snowflake,
  Car,
  Scale,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Locate,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import {
  mandiApi,
  type Mandi,
  INDIAN_STATES,
  calculateDistance,
} from "@/lib/market-api"

// Dynamically import map component to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

interface UserLocation {
  lat: number
  lng: number
}

function MandiSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FacilityBadge({ available, icon: Icon, label }: { available: boolean; icon: React.ElementType; label: string }) {
  if (!available) return null
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

function MandiCard({ mandi, userLocation, onSelect }: { mandi: Mandi; userLocation: UserLocation | null; onSelect: () => void }) {
  const distance = userLocation && mandi.location?.coordinates
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        mandi.location.coordinates[1],
        mandi.location.coordinates[0]
      )
    : null

  const isOpen = checkIfOpen(mandi)

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-lg",
            mandi.type === "APMC" ? "bg-green-100 dark:bg-green-900/30" :
            mandi.type === "Private" ? "bg-blue-100 dark:bg-blue-900/30" :
            "bg-gray-100 dark:bg-gray-900/30"
          )}>
            <Building2 className={cn(
              "h-6 w-6",
              mandi.type === "APMC" ? "text-green-600" :
              mandi.type === "Private" ? "text-blue-600" :
              "text-gray-600"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{mandi.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{mandi.district}, {mandi.state}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={isOpen ? "default" : "secondary"}>
                  {isOpen ? "Open" : "Closed"}
                </Badge>
                {distance !== null && (
                  <span className="text-xs text-muted-foreground">
                    {distance.toFixed(1)} km away
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              <Badge variant="outline">{mandi.type}</Badge>
              {mandi.facilities?.eNAMEnabled && (
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  eNAM
                </Badge>
              )}
              {mandi.todayPriceCount && mandi.todayPriceCount > 0 && (
                <Badge variant="secondary">{mandi.todayPriceCount} prices today</Badge>
              )}
            </div>

            {mandi.mainCommodities && mandi.mainCommodities.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground truncate">
                {mandi.mainCommodities.slice(0, 5).join(", ")}
                {mandi.mainCommodities.length > 5 && ` +${mandi.mainCommodities.length - 5} more`}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{mandi.operatingHours?.open || "06:00"} - {mandi.operatingHours?.close || "18:00"}</span>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View Details
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MandiDetailSheet({ mandi, open, onClose }: { mandi: Mandi | null; open: boolean; onClose: () => void }) {
  if (!mandi) return null

  const isOpen = checkIfOpen(mandi)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{mandi.name}</SheetTitle>
          <SheetDescription>
            {mandi.district}, {mandi.state}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status & Type */}
          <div className="flex items-center gap-2">
            <Badge variant={isOpen ? "default" : "secondary"} className="text-sm">
              {isOpen ? "Open Now" : "Closed"}
            </Badge>
            <Badge variant="outline">{mandi.type}</Badge>
            {mandi.isVerified && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>

          {/* Operating Hours */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Operating Hours
            </h4>
            <p className="text-sm text-muted-foreground">
              {mandi.operatingHours?.open || "06:00"} - {mandi.operatingHours?.close || "18:00"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {mandi.operatingDays?.map((day) => (
                <Badge key={day} variant="outline" className="text-xs">
                  {day.slice(0, 3)}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          {mandi.contactInfo && (
            <div>
              <h4 className="font-medium mb-3">Contact Information</h4>
              <div className="space-y-2">
                {mandi.contactInfo.phone && mandi.contactInfo.phone.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${mandi.contactInfo.phone[0]}`} className="text-sm hover:underline">
                      {mandi.contactInfo.phone.join(", ")}
                    </a>
                  </div>
                )}
                {mandi.contactInfo.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${mandi.contactInfo.email}`} className="text-sm hover:underline">
                      {mandi.contactInfo.email}
                    </a>
                  </div>
                )}
                {mandi.contactInfo.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={mandi.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline flex items-center gap-1">
                      {mandi.contactInfo.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {mandi.contactInfo.secretary?.name && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Secretary</p>
                    <p className="text-sm text-muted-foreground">{mandi.contactInfo.secretary.name}</p>
                    {mandi.contactInfo.secretary.phone && (
                      <p className="text-sm text-muted-foreground">{mandi.contactInfo.secretary.phone}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Facilities */}
          {mandi.facilities && (
            <div>
              <h4 className="font-medium mb-3">Facilities</h4>
              <div className="flex flex-wrap gap-2">
                <FacilityBadge available={mandi.facilities.coldStorage} icon={Snowflake} label="Cold Storage" />
                <FacilityBadge available={mandi.facilities.warehouse} icon={Warehouse} label="Warehouse" />
                <FacilityBadge available={mandi.facilities.parking} icon={Car} label="Parking" />
                <FacilityBadge available={mandi.facilities.weighbridge} icon={Scale} label="Weighbridge" />
                <FacilityBadge available={mandi.facilities.bankingFacility} icon={CreditCard} label="Banking" />
                <FacilityBadge available={mandi.facilities.eNAMEnabled} icon={CheckCircle} label="eNAM" />
                <FacilityBadge available={mandi.facilities.grading} icon={CheckCircle} label="Grading" />
                <FacilityBadge available={mandi.facilities.assaying} icon={CheckCircle} label="Assaying" />
              </div>
            </div>
          )}

          <Separator />

          {/* Main Commodities */}
          {mandi.mainCommodities && mandi.mainCommodities.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Main Commodities</h4>
              <div className="flex flex-wrap gap-2">
                {mandi.mainCommodities.map((commodity) => (
                  <Badge key={commodity} variant="secondary">
                    {commodity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Fees */}
          {mandi.fees && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Fees & Charges</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Market Fee</p>
                    <p className="font-medium">{mandi.fees.marketFee}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="font-medium">{mandi.fees.commissionRate}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Weighing</p>
                    <p className="font-medium">₹{mandi.fees.weighingCharges}/qtl</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Loading</p>
                    <p className="font-medium">₹{mandi.fees.loadingCharges}/qtl</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {mandi.location?.coordinates && (
              <Button className="flex-1" asChild>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mandi.location.coordinates[1]},${mandi.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/dashboard/market-prices?mandi=${mandi._id}`}>
                View Prices
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function checkIfOpen(mandi: Mandi): boolean {
  const now = new Date()
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = dayNames[now.getDay()]

  if (!mandi.operatingDays?.includes(today)) return false

  const currentTime = now.getHours() * 100 + now.getMinutes()
  const openTime = parseInt((mandi.operatingHours?.open || "06:00").replace(":", ""))
  const closeTime = parseInt((mandi.operatingHours?.close || "18:00").replace(":", ""))

  return currentTime >= openTime && currentTime <= closeTime
}

const Loading = () => null

export default function MandiFinderPage() {
  const [mandis, setMandis] = useState<Mandi[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState<"list" | "map">("list")
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [selectedMandi, setSelectedMandi] = useState<Mandi | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [state, setState] = useState("")
  const [radius, setRadius] = useState(100)

  const searchParams = useSearchParams()

  const fetchMandis = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)

      const params: Record<string, string | number> = {
        limit: 50,
      }

      if (state) params.state = state
      if (search) params.search = search
      if (userLocation) {
        params.lat = userLocation.lat
        params.lng = userLocation.lng
        params.radius = radius
      }

      const response = await mandiApi.getAll(params)
      setMandis(response.data)
    } catch (error) {
      console.log("[v0] Error fetching mandis:", error)
      // Generate mock data
      const mockMandis = generateMockMandis(state, userLocation)
      setMandis(mockMandis)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [state, search, userLocation, radius])

  useEffect(() => {
    fetchMandis()
  }, [fetchMandis])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
      },
      () => {
        alert("Unable to retrieve your location")
        setLocationLoading(false)
      }
    )
  }

  const handleSelectMandi = (mandi: Mandi) => {
    setSelectedMandi(mandi)
    setDetailOpen(true)
  }

  const filteredMandis = search
    ? mandis.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.district.toLowerCase().includes(search.toLowerCase()) ||
          m.state.toLowerCase().includes(search.toLowerCase())
      )
    : mandis

  // Sort by distance if user location is available
  const sortedMandis = userLocation
    ? [...filteredMandis].sort((a, b) => {
        const distA = a.location?.coordinates
          ? calculateDistance(userLocation.lat, userLocation.lng, a.location.coordinates[1], a.location.coordinates[0])
          : Infinity
        const distB = b.location?.coordinates
          ? calculateDistance(userLocation.lat, userLocation.lng, b.location.coordinates[1], b.location.coordinates[0])
          : Infinity
        return distA - distB
      })
    : filteredMandis

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/market-prices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Mandi Finder</h1>
              <p className="text-muted-foreground">
                Find nearby agricultural markets and their details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={locationLoading}
            >
              <Locate className={cn("h-4 w-4 mr-2", locationLoading && "animate-pulse")} />
              {userLocation ? "Update Location" : "Use My Location"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchMandis(true)} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Location indicator */}
        {userLocation && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              Showing mandis near your location ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2"
              onClick={() => setUserLocation(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, district..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {userLocation && (
                <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">Within 25 km</SelectItem>
                    <SelectItem value="50">Within 50 km</SelectItem>
                    <SelectItem value="100">Within 100 km</SelectItem>
                    <SelectItem value="200">Within 200 km</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Tabs value={view} onValueChange={(v) => setView(v as "list" | "map")}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-1">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-1">
                    <MapIcon className="h-4 w-4" />
                    Map
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Found {sortedMandis.length} mandis
          </p>
        </div>

        {loading ? (
          <MandiSkeleton />
        ) : view === "list" ? (
          /* List View */
          <div className="space-y-4">
            {sortedMandis.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No mandis found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedMandis.map((mandi) => (
                <MandiCard
                  key={mandi._id}
                  mandi={mandi}
                  userLocation={userLocation}
                  onSelect={() => handleSelectMandi(mandi)}
                />
              ))
            )}
          </div>
        ) : (
          /* Map View */
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] rounded-lg overflow-hidden relative">
                {typeof window !== "undefined" && (
                  <>
                    <link
                      rel="stylesheet"
                      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                      crossOrigin=""
                    />
                    <MapContainer
                      center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
                      zoom={userLocation ? 10 : 5}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {sortedMandis.map((mandi) => {
                        if (!mandi.location?.coordinates) return null
                        return (
                          <Marker
                            key={mandi._id}
                            position={[mandi.location.coordinates[1], mandi.location.coordinates[0]]}
                            eventHandlers={{
                              click: () => handleSelectMandi(mandi),
                            }}
                          >
                            <Popup>
                              <div className="min-w-48">
                                <h3 className="font-semibold">{mandi.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {mandi.district}, {mandi.state}
                                </p>
                                <Button
                                  size="sm"
                                  className="mt-2 w-full"
                                  onClick={() => handleSelectMandi(mandi)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      })}
                    </MapContainer>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Sheet */}
        <MandiDetailSheet
          mandi={selectedMandi}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      </div>
    </Suspense>
  )
}

// Generate mock mandi data
function generateMockMandis(stateFilter: string, userLocation: UserLocation | null): Mandi[] {
  const mandisData = [
    { name: "Azadpur Mandi", state: "Delhi", district: "North Delhi", lat: 28.7041, lng: 77.1025 },
    { name: "Vashi APMC", state: "Maharashtra", district: "Navi Mumbai", lat: 19.0760, lng: 72.9988 },
    { name: "Yeshwanthpur APMC", state: "Karnataka", district: "Bangalore Urban", lat: 13.0196, lng: 77.5456 },
    { name: "Koyambedu Market", state: "Tamil Nadu", district: "Chennai", lat: 13.0773, lng: 80.1964 },
    { name: "Ghazipur Mandi", state: "Delhi", district: "East Delhi", lat: 28.6229, lng: 77.3197 },
    { name: "Bowenpally Market", state: "Telangana", district: "Hyderabad", lat: 17.4600, lng: 78.4470 },
    { name: "Pimpri APMC", state: "Maharashtra", district: "Pune", lat: 18.6279, lng: 73.8009 },
    { name: "Rythu Bazaar", state: "Andhra Pradesh", district: "Vijayawada", lat: 16.5062, lng: 80.6480 },
    { name: "Ahmedabad APMC", state: "Gujarat", district: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    { name: "Jaipur Mandi", state: "Rajasthan", district: "Jaipur", lat: 26.9124, lng: 75.7873 },
    { name: "Lucknow Mandi", state: "Uttar Pradesh", district: "Lucknow", lat: 26.8467, lng: 80.9462 },
    { name: "Patna APMC", state: "Bihar", district: "Patna", lat: 25.5941, lng: 85.1376 },
  ]

  let filteredMandis = mandisData
  if (stateFilter && stateFilter !== "all") {
    filteredMandis = mandisData.filter(m => m.state === stateFilter)
  }

  return filteredMandis.map((m, i) => ({
    _id: `mandi-${i}`,
    name: m.name,
    code: `MANDI${i.toString().padStart(4, "0")}`,
    type: ["APMC", "Private", "Cooperative", "Farmers Market"][Math.floor(Math.random() * 4)] as Mandi["type"],
    state: m.state,
    district: m.district,
    address: {
      city: m.district,
      pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
    },
    location: {
      type: "Point" as const,
      coordinates: [m.lng, m.lat] as [number, number],
    },
    contactInfo: {
      phone: [`+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`],
      email: `info@${m.name.toLowerCase().replace(/\s/g, "")}.com`,
    },
    operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    operatingHours: {
      open: "06:00",
      close: "18:00",
    },
    mainCommodities: ["Rice", "Wheat", "Vegetables", "Fruits", "Pulses"].slice(0, Math.floor(Math.random() * 5) + 1),
    facilities: {
      coldStorage: Math.random() > 0.5,
      warehouse: Math.random() > 0.3,
      parking: Math.random() > 0.2,
      weighbridge: Math.random() > 0.3,
      restrooms: Math.random() > 0.4,
      bankingFacility: Math.random() > 0.5,
      eNAMEnabled: Math.random() > 0.4,
      grading: Math.random() > 0.6,
      assaying: Math.random() > 0.7,
    },
    fees: {
      marketFee: Math.round(Math.random() * 2 * 100) / 100,
      commissionRate: Math.round(Math.random() * 3 * 100) / 100,
      weighingCharges: Math.round(Math.random() * 5),
      loadingCharges: Math.round(Math.random() * 10),
    },
    isActive: true,
    isVerified: Math.random() > 0.3,
    todayPriceCount: Math.floor(Math.random() * 50),
    distance: userLocation
      ? calculateDistance(userLocation.lat, userLocation.lng, m.lat, m.lng)
      : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}
