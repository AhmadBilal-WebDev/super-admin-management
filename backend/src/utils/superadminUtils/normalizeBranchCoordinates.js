const parseCoord = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return num;
};

const isValidLatitude = (num) => num >= -90 && num <= 90;
const isValidLongitude = (num) => num >= -180 && num <= 180;

/**
 * Validates restaurant/branch map pin coordinates.
 * @param {{ latitude?: any, longitude?: any, lat?: any, lng?: any, lon?: any }} source
 * @param {{ required?: boolean }} options
 */
const normalizeBranchCoordinates = (source = {}, { required = false } = {}) => {
    const rawLat = source.latitude ?? source.lat;
    const rawLng = source.longitude ?? source.lng ?? source.lon;

    const hasLat = rawLat !== undefined && rawLat !== null && String(rawLat).trim() !== "";
    const hasLng = rawLng !== undefined && rawLng !== null && String(rawLng).trim() !== "";

    if (!hasLat && !hasLng) {
        if (required) {
            return {
                error: "Branch latitude and longitude are required",
            };
        }
        return { provided: false };
    }

    if (!hasLat || !hasLng) {
        return {
            error: "Both latitude and longitude are required together",
        };
    }

    const latitude = parseCoord(rawLat);
    const longitude = parseCoord(rawLng);

    if (latitude === null || longitude === null) {
        return {
            error: "Latitude and longitude must be valid numbers",
        };
    }

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
        return {
            error: `Invalid latitude/longitude: ${latitude}, ${longitude}`,
        };
    }

    return {
        provided: true,
        latitude: String(latitude),
        longitude: String(longitude),
    };
};

export default normalizeBranchCoordinates;
