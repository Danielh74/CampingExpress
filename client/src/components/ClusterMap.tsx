
import { useRef, useEffect } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import '../styles/map.css';
import { CampgroundList } from '../models/Campground';

interface Props {
    campgrounds: CampgroundList[]
}

export default function ClusterMap({ campgrounds }: Props) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maptilersdk.Map>();
    maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    useEffect(() => {
        if (!map.current) {
            map.current = new maptilersdk.Map({

                container: mapContainer.current as HTMLElement,
                style: maptilersdk.MapStyle.STREETS,
                center: [-103.59179687498357, 40.66995747013945],
                zoom: 3
            });
            map.current.on('load', function () {
                map.current?.addSource('campgrounds', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    },
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50,
                });
                console.log(map.current?.getSource('campgrounds'))
                map.current?.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'campgrounds',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            'darkOrange',
                            10,
                            'orange',
                            30,
                            'gold'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            15,
                            10,
                            20,
                            30,
                            25
                        ]
                    }
                });

                map.current?.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'campgrounds',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                map.current?.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'campgrounds',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': 'orangeRed',
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                });

                map.current?.on('click', 'clusters', async (e) => {
                    const features = map.current?.queryRenderedFeatures(e.point, {
                        layers: ['clusters']
                    });

                    if (!features || features.length === 0) {
                        console.error('No features found at the clicked point');
                        return;
                    }

                    const clusterId = features[0]?.properties?.cluster_id;

                    if (clusterId === undefined) {
                        console.error('Cluster ID is undefined');
                        return;
                    }

                    const geometry = features[0]?.geometry;

                    if (!geometry || geometry.type !== 'Point') {
                        console.error('Feature geometry is not a Point');
                        return;
                    }

                    const coordinates = geometry.coordinates; // TypeScript now knows it's a Point

                    try {
                        // Cast the source to GeoJSONSource to access getClusterExpansionZoom
                        const source = map.current?.getSource('campgrounds') as maptilersdk.GeoJSONSource;

                        if (!source || typeof source.getClusterExpansionZoom !== 'function') {
                            console.error('Source is not cluster-enabled or method is unavailable');
                            return;
                        }

                        const zoom = await source.getClusterExpansionZoom(clusterId);

                        map.current?.easeTo({
                            center: coordinates as [number, number],
                            zoom
                        });
                    } catch (error) {
                        console.error('Error expanding cluster:', error);
                    }
                });

                map.current?.on('click', 'unclustered-point', function (e) {
                    if (!e.features || e.features.length === 0) {
                        console.error('No features found at the clicked point');
                        return;
                    }

                    // Extract the first feature
                    const feature = e.features[0];

                    // Ensure properties and geometry exist
                    if (!feature.properties || !feature.geometry || feature.geometry.type !== 'Point') {
                        console.error('Feature properties or geometry are missing or invalid');
                        return;
                    }

                    if (!feature.properties || !feature.properties.popUpMarkup) {
                        console.log(feature)
                        console.error('popUpMarkup property is missing in the feature:', feature.properties);
                        return;
                    }

                    // Parse popup data from feature properties
                    let popUpData;
                    try {
                        popUpData = JSON.parse(feature.properties.popUpMarkup);
                    } catch (error) {
                        console.error('Failed to parse popUpMarkup:', error);
                        return;
                    }

                    const { id, title, location } = popUpData;

                    // Ensure geometry coordinates exist and are valid
                    const coordinates = [...feature.geometry.coordinates]; // Clone coordinates to avoid mutation
                    if (!coordinates || coordinates.length < 2) {
                        console.error('Invalid geometry coordinates');
                        return;
                    }

                    // Construct popup content
                    const popUpText = `
                    <h5><a href="/campground/${id}">${title}</a></h5>
                    <span>${location}</span>
                `;

                    // Adjust for map wrapping
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    // Create and add popup
                    new maptilersdk.Popup()
                        .setLngLat(coordinates as [number, number])
                        .setHTML(popUpText)
                        .addTo(map.current as maptilersdk.Map);
                });


            });
        }
        console.log(map.current?.getSource('campgrounds'))
    }, []);

    useEffect(() => {
        // Ensure map is initialized and source exists
        if (map.current && map.current.isStyleLoaded() && map.current.getSource('campgrounds')) {
            const source = map.current.getSource('campgrounds') as maptilersdk.GeoJSONSource;

            source.setData({
                type: 'FeatureCollection',
                features: campgrounds.map(camp => ({
                    type: 'Feature',
                    properties: {
                        popUpMarkup: JSON.stringify({
                            id: camp.id,
                            title: camp.title,
                            location: camp.location,
                        }),
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: camp.geometry.coordinates,
                    },
                })),
            });
        }
    }, [campgrounds]); // This will trigger only when `campgrounds` changes

    useEffect(() => {
        if (map.current) return; // Skip if map is already initialized
    }, []);


    return (
        <div className="map-wrap">
            <div ref={mapContainer} className="map" />
        </div>
    );
}