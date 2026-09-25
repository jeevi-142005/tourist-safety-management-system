import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/db-client/server";

export async function GET(request: NextRequest) {
  try {
    const dbClient = await createServerClient();


    const { data: { user } } = await dbClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await dbClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['police', 'tourism_dept', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: activeTourists, count: activeTouristsCount } = await dbClient
      .from('tourist_ids')
      .select('*')
      .eq('is_active', true)
      .gte('trip_end_date', new Date().toISOString().split('T')[0]);

    const { data: activeAlerts } = await dbClient
      .from('alerts')
      .select(`*, profiles:user_id (full_name, email, phone)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: heatmapData } = await dbClient
      .rpc('get_tourist_heatmap_data', { hours_back: 24 });

    const { data: riskZones } = await dbClient
      .from('geo_zones')
      .select('*')
      .in('zone_type', ['high_risk', 'restricted']);

    const { data: recentEFIRs } = await dbClient
      .from('efir_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: safetyStats } = await dbClient
      .rpc('get_safety_score_statistics');

    return NextResponse.json({
      summary: {
        activeTourists: activeTouristsCount || 0,
        activeAlerts: activeAlerts?.length || 0,
        criticalAlerts: activeAlerts?.filter((alert: any) => alert.severity === 'critical').length || 0,
        recentEFIRs: recentEFIRs?.length || 0
      },
      alerts: activeAlerts || [],
      heatmapData: heatmapData || [],
      riskZones: riskZones || [],
      recentEFIRs: recentEFIRs || [],
      safetyStats: safetyStats || []
    });

  } catch (error) {
    console.error('Authority dashboard data error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
