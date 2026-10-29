const parseCoord = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return num;
};

const isValidLatitude = (num) => num >= -90 && num <= 90;
const isValidLongitude = (num) => num >= -180 && num <= 180;

const MIN_POLYGON_POINTS = 4;
const MIN_RADIUS_KM = 0.1;
const MAX_RADIUS_KM = 200;

/**
 * Normalize map polygon points from frontend.
 * Accepts: [{ latitude, longitude }] | [{ lat, lng }] | [[lat, lng]]
 * Minimum 4 points. Closing duplicate of first point is dropped.
 */
const normalizeServicePolygon = (raw) => {
    if (raw === undefined || raw === null || raw === "") {
        return { error: "polygon is required (minimum 4 map points)" };
    }

    let list = raw;
    if (typeof raw === "string") {
        try {
            list = JSON.parse(raw);
        } catch {
            return { error: "Invalid polygon JSON" };
        }
    }

    if (!Array.isArray(list)) {
        return { error: "polygon must be an array of points" };
    }

    const polygon = [];

    for (const point of list) {
        let latitude;
        let longitude;

        if (Array.isArray(point) && point.length >= 2) {
            const a = Number(point[0]);
            const b = Number(point[1]);
            if (!Number.isFinite(a) || !Number.isFinite(b)) {
                return { error: "Invalid polygon point coordinates" };
            }
            // [lng, lat] when first value can't be latitude
            if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
                longitude = a;
                latitude = b;
            } else {
                latitude = a;
                longitude = b;
            }
        } else if (point && typeof point === "object") {
            latitude = parseCoord(point.latitude ?? point.lat);
            longitude = parseCoord(
                point.longitude ?? point.lng ?? point.lon
            );
        } else {
            return { error: "Invalid polygon point format" };
        }

        if (latitude === null || longitude === null) {
            return {
                error: "Each polygon point needs latitude and longitude",
            };
        }

        if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
            return {
                error: `Invalid polygon coordinates: ${latitude}, ${longitude}`,
            };
        }

        polygon.push({
            latitude: String(latitude),
            longitude: String(longitude),
        });
    }

    if (polygon.length >= 2) {
        const first = polygon[0];
        const last = polygon[polygon.length - 1];
        if (
            first.latitude === last.latitude &&
            first.longitude === last.longitude
        ) {
            polygon.pop();
        }
    }

    if (polygon.length < MIN_POLYGON_POINTS) {
        return {
            error: `Select at least ${MIN_POLYGON_POINTS} points on the map`,
        };
    }

    return { polygon };
};

const parseRadiusKm = (raw, { required = false } = {}) => {
    if (raw === undefined || raw === null || raw === "") {
        if (required) {
            return { error: "radiusKm is required (e.g. 20 or 35)" };
        }
        return { provided: false, radiusKm: null };
    }

    const value = Number(raw);
    if (!Number.isFinite(value)) {
        return { error: "radiusKm must be a valid number" };
    }

    if (value < MIN_RADIUS_KM || value > MAX_RADIUS_KM) {
        return {
            error: `radiusKm must be between ${MIN_RADIUS_KM} and ${MAX_RADIUS_KM}`,
        };
    }

    return {
        provided: true,
        radiusKm: Math.round(value * 10) / 10,
    };
};

const formatServicePolygon = (polygon = []) =>
    (Array.isArray(polygon) ? polygon : []).map((point) => ({
        latitude: point?.latitude != null ? String(point.latitude) : "",
        longitude: point?.longitude != null ? String(point.longitude) : "",
    }));

/**
 * Ray-casting point-in-polygon.
 * @returns {boolean}
 */
const isPointInsidePolygon = (latitude, longitude, polygon = []) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

    const ring = (Array.isArray(polygon) ? polygon : [])
        .map((p) => ({
            lat: Number(p.latitude ?? p.lat),
            lng: Number(p.longitude ?? p.lng ?? p.lon),
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (ring.length < 3) return false;

    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i].lng;
        const yi = ring[i].lat;
        const xj = ring[j].lng;
        const yj = ring[j].lat;

        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
};

/**
 * Check if customer lat/lng is inside branch service polygon.
 * Use this when placing orders — outside = reject.
 */
const isDeliveryInsideBranchServiceArea = (branch, latitude, longitude) => {
    const polygon = branch?.servicePolygon;
    if (!Array.isArray(polygon) || polygon.length < MIN_POLYGON_POINTS) {
        return {
            ok: false,
            reason: "Branch service area is not set yet",
        };
    }

    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);

    if (lat === null || lng === null) {
        return {
            ok: false,
            reason: "Customer latitude and longitude are required",
        };
    }

    if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
        return {
            ok: false,
            reason: "Invalid customer latitude/longitude",
        };
    }

    if (!isPointInsidePolygon(lat, lng, polygon)) {
        return {
            ok: false,
            reason: "This location is outside the restaurant service area",
        };
    }

    return { ok: true };
};

export {
    MIN_POLYGON_POINTS,
    MIN_RADIUS_KM,
    MAX_RADIUS_KM,
    normalizeServicePolygon,
    parseRadiusKm,
    formatServicePolygon,
    isPointInsidePolygon,
    isDeliveryInsideBranchServiceArea,
    parseCoord,
};
export default isDeliveryInsideBranchServiceArea;
