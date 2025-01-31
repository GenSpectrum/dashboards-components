import leafletStyle from 'leaflet/dist/leaflet.css?inline';
import { unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import leafletStyleModifications from '../../preact/sequencesByLocation/leafletStyleModifications.css?inline';
import {
    SequencesByLocation,
    type SequencesByLocationProps,
} from '../../preact/sequencesByLocation/sequences-by-location';
import type { Equals, Expect } from '../../utils/typeAssertions';
import { PreactLitAdapterWithGridJsStyles } from '../PreactLitAdapterWithGridJsStyles';

const leafletCss = unsafeCSS(leafletStyle);
const leafletModificationsCss = unsafeCSS(leafletStyleModifications);

/**
 * ## Context
 *
 * This component shows the geographic distribution of sequence data from LAPIS.
 * It displays the count and proportion (number of sample per `lapisLocationField` / number of samples matching the `lapisFilter`)
 * of the data by location.
 *
 * ## Views
 *
 * ### Map View
 *
 * This view displays a chloropleth map based on [Leaflet](https://leafletjs.com/).
 * The component expects a `mapSource` object that specifies where the map data can be downloaded from.
 * We can imagine that we add other map source types later (for example, GeoJSON).
 *
 * #### TopoJSON
 *
 * Suppose you provide this example object as `mapSource`:
 *
 * ```json
 * {
 *    "type": "topojson",
 *    "url": "https://example.com/map.topojson",
 *    "topologyObjectsKey": "myObjectKey"
 * }
 * ```
 *
 * The URL must point to a [TopoJSON file](https://github.com/topojson/topojson) that contains the map data.
 * The TopoJSON file must schematically look like this,
 * where `objects[topologyObjectsKey]` must be a valid GeometryCollection (`objects.myObjectKey` in this example):
 *
 * ```json
 * {
 *   "type": "Topology",
 *   "objects": {
 *     "myObjectKey": {
 *       "type": "GeometryCollection",
 *       "geometries": [
 *         {
 *           "type": "Polygon",
 *           "properties": {
 *             "name": "North Rhine Westphalia"
 *           },
 *           "id": "DE.NW",
 *           "arcs": [...]
 *         },
 *         ...
 *       ]
 *     }
 *   },
 *   "arcs": [...],
 *   "transform": {...}
 * }
 * ```
 *
 * You can use any valid TopoJSON file.
 * https://github.com/markmarkoh/datamaps/tree/master/src/js/data contains TopoJSON files for many countries.
 *
 * The `lapisFilter` is used to select the data to display, and it is aggregated by the `lapisLocationField`.
 * This component assumes that every geometry object in the TopoJSON file has a `properties.name` field.
 *
 * The values that LAPIS returns for `lapisLocationField` must match the `properties.name` in the map data.
 * LAPIS entries where `lapisLocationField` is `null` are ignored on the map.
 *
 * The names of the locations in the TopoJSON map and in LAPIS should match.
 * However, there are two cases of misalignment:
 * - If there is a LAPIS location that does not match any location in the TopoJSON map,
 *   the component will log a console warning to assist in creating map data that aligns with the LAPIS data.
 * - If a TopoJSON location does not match any LAPIS location for the given filter,
 *   no data will be displayed for this location.
 *   This is expected, as LAPIS will only return locations where sequences have been collected for that filter.
 *
 * ### Table View
 *
 * This view displays the data in a table format.
 * It is similar to the table view of the `gs-aggregate` component.
 * The table has three columns:
 * - `lapisLocationField`,
 * - `count` (the number of samples in this location matching the `lapisFilter`),
 * - `proportion` (`count` / sum of the `count` of all locations).
 */
@customElement('gs-sequences-by-location')
export class SequencesByLocationComponent extends PreactLitAdapterWithGridJsStyles {
    static override styles = [...PreactLitAdapterWithGridJsStyles.styles, leafletCss, leafletModificationsCss];

    /**
     * LAPIS filter to select the displayed data.
     * If you want to display the distribution over the states of a certain country,
     * you should usually filter by that country here (e.g. { country: 'USA' }).
     */
    @property({ type: Object })
    lapisFilter: Record<string, string | string[] | number | null | boolean | undefined> & {
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    } = {};

    /**
     * Required.
     *
     * The location field to aggregate the data by.
     * This should match the selected map location granularity.
     */
    @property({ type: String })
    lapisLocationField: string = '';

    /**
     * Required when using the map view.
     *
     * The source of the map data. See component level docs for more information.
     */
    @property({ type: Object })
    mapSource: { type: 'topojson'; url: string; topologyObjectsKey: string } | undefined = undefined;

    /**
     * Enable map navigation (dragging, keyboard navigation, zooming).
     */
    @property({ type: Boolean })
    enableMapNavigation: boolean = false;

    /**
     * The width of the component.
     * Not that the map in the map view is not responsive
     * (i.e. does not adjust its size when the component is resized).
     *
     * Visit https://genspectrum.github.io/dashboard-components/?path=/docs/components-size-of-components--docs for more information.
     */
    @property({ type: String })
    width: string = '100%';

    /**
     * The height of the component.
     *
     * Visit https://genspectrum.github.io/dashboard-components/?path=/docs/components-size-of-components--docs for more information.
     */
    @property({ type: String })
    height: string | undefined = undefined;

    /**
     A list of tabs with views that this component should provide.
     */
    @property({ type: Array })
    views: ('map' | 'table')[] = ['map', 'table'];

    /**
     * The initial zoom level of the map.
     */
    @property({ type: Number })
    zoom: number = 1;

    /**
     * Initially shift the center of the map in x direction (longitude).
     *
     * `-180` is the International Date Line with the map shifted to the right, `0` is the prime meridian,
     * `180` is the International Date Line with the map shifted to the left.
     */
    @property({ type: Number })
    offsetX: number = 0;

    /**
     * Initially shift the center of the map in y direction (latitude).
     *
     * `-90` is the South Pole, `0` is the equator, `90` is the North Pole.
     */
    @property({ type: Number })
    offsetY: number = 0;

    /**
     * The maximum number of rows to display in the table view.
     * Set to `false` to disable pagination. Set to `true` to enable pagination with a default limit (10).
     */
    @property({ type: Object })
    pageSize: boolean | number = false;

    override render() {
        return (
            <SequencesByLocation
                lapisFilter={this.lapisFilter}
                lapisLocationField={this.lapisLocationField}
                mapSource={this.mapSource}
                enableMapNavigation={this.enableMapNavigation}
                width={this.width}
                height={this.height}
                views={this.views}
                zoom={this.zoom}
                offsetX={this.offsetX}
                offsetY={this.offsetY}
                pageSize={this.pageSize}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-sequences-by-location': SequencesByLocationComponent;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-sequences-by-location': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type LapisFilterMatches = Expect<
    Equals<typeof SequencesByLocationComponent.prototype.lapisFilter, SequencesByLocationProps['lapisFilter']>
>;
type LapisLocationFieldMatches = Expect<
    Equals<
        typeof SequencesByLocationComponent.prototype.lapisLocationField,
        SequencesByLocationProps['lapisLocationField']
    >
>;
type MapSourceMatches = Expect<
    Equals<typeof SequencesByLocationComponent.prototype.mapSource, SequencesByLocationProps['mapSource']>
>;
type EnableMapNavigationMatches = Expect<
    Equals<
        typeof SequencesByLocationComponent.prototype.enableMapNavigation,
        SequencesByLocationProps['enableMapNavigation']
    >
>;
type WidthMatches = Expect<
    Equals<typeof SequencesByLocationComponent.prototype.width, SequencesByLocationProps['width']>
>;
type HeightMatches = Expect<
    Equals<typeof SequencesByLocationComponent.prototype.height, SequencesByLocationProps['height']>
>;
type ViewsMatches = Expect<
    Equals<typeof SequencesByLocationComponent.prototype.views, SequencesByLocationProps['views']>
>;
type ZoomMatches = Expect<Equals<typeof SequencesByLocationComponent.prototype.zoom, SequencesByLocationProps['zoom']>>;
type OffsetXMatches = Expect<
    Equals<typeof SequencesByLocationComponent.prototype.offsetX, SequencesByLocationProps['offsetX']>
>;
type OffsetYMatches = Expect<
    Equals<typeof SequencesByLocationComponent.prototype.offsetY, SequencesByLocationProps['offsetY']>
>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */
