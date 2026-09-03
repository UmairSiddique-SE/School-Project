import React, { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

const listOf = (d:any) => Array.isArray(d) ? d : d?.data || d?.items || [];
export default function Transport() {
  const [routes,setRoutes]=useState<any[]>([]); const [vehicles,setVehicles]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{const [r,v]=await Promise.all([apiClient.get("/academics/routes"),apiClient.get("/academics/vehicles")]);setRoutes(listOf(r.data));setVehicles(listOf(v.data));}catch(e:any){setRoutes([]);setVehicles([]);toast.error(e?.response?.data?.message||"Unable to load transport data.");}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  return <div className="space-y-6 max-w-7xl mx-auto"><div className="flex justify-between"><div><h1 className="text-3xl font-black">Transport</h1><p className="text-sm text-muted-foreground">Live routes and vehicles registered for this school.</p></div><button onClick={load} className="border rounded-xl px-4 py-2 flex gap-2 items-center"><RefreshCw size={15}/>Refresh</button></div>{loading?<div className="p-12 flex justify-center"><Loader2 className="animate-spin"/></div>:<div className="grid lg:grid-cols-2 gap-6"><section className="border rounded-2xl overflow-hidden"><div className="p-4 border-b font-bold">Routes ({routes.length})</div>{routes.length===0?<div className="p-10 text-center text-muted-foreground">No routes registered.</div>:routes.map(x=><div key={x.id} className="p-4 border-b last:border-0"><b>{x.name||x.routeName||"Route"}</b><p className="text-sm text-muted-foreground">{x.startPoint||x.from||""} {x.endPoint||x.to?`→ ${x.endPoint||x.to}`:""}</p></div>)}</section><section className="border rounded-2xl overflow-hidden"><div className="p-4 border-b font-bold">Vehicles ({vehicles.length})</div>{vehicles.length===0?<div className="p-10 text-center text-muted-foreground">No vehicles registered.</div>:vehicles.map(x=><div key={x.id} className="p-4 border-b last:border-0"><b>{x.registrationNo||x.number||x.name||"Vehicle"}</b><p className="text-sm text-muted-foreground">{x.type||""} {x.capacity?`• Capacity ${x.capacity}`:""}</p></div>)}</section></div>}</div>;
}
