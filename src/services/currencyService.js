export const getRates = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Currency rates fetched:", data);
        return data;
    } catch (error) {
        console.error("Error fetching currency rates:", error);
        throw error;
    }
};