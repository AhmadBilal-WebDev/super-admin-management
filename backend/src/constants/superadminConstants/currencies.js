const CURRENCIES = [
    { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", aliases: ["rupee", "pkr"] },
    { code: "USD", name: "US Dollar", symbol: "$", aliases: ["dollar", "usd", "us dollar"] },
    { code: "EUR", name: "Euro", symbol: "€", aliases: ["euro", "eur"] },
    { code: "GBP", name: "British Pound", symbol: "£", aliases: ["pound", "gbp", "gpg", "sterling"] },
    { code: "SAR", name: "Saudi Riyal", symbol: "﷼", aliases: ["riyal", "sar", "saudi"] },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", aliases: ["dirham", "aed", "uae"] },
    { code: "INR", name: "Indian Rupee", symbol: "₹", aliases: ["inr"] },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", aliases: ["cad"] },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", aliases: ["aud"] },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF", aliases: ["franc", "chf"] },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", aliases: ["yen", "jpy"] },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", aliases: ["yuan", "cny", "rmb"] },
    { code: "TRY", name: "Turkish Lira", symbol: "₺", aliases: ["lira", "try"] },
    { code: "QAR", name: "Qatari Riyal", symbol: "QR", aliases: ["qar"] },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD", aliases: ["kwd"] },
    { code: "BHD", name: "Bahraini Dinar", symbol: "BD", aliases: ["bhd"] },
    { code: "OMR", name: "Omani Rial", symbol: "OMR", aliases: ["omr"] },
    { code: "EGP", name: "Egyptian Pound", symbol: "E£", aliases: ["egp"] },
    { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", aliases: ["myr"] },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", aliases: ["sgd"] },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", aliases: ["nzd"] },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", aliases: ["hkd"] },
    { code: "ZAR", name: "South African Rand", symbol: "R", aliases: ["rand", "zar"] },
    { code: "BRL", name: "Brazilian Real", symbol: "R$", aliases: ["brl"] },
    { code: "MXN", name: "Mexican Peso", symbol: "Mex$", aliases: ["mxn"] },
];

const CURRENCY_CODES = CURRENCIES.map((item) => item.code);

const currencyLookup = new Map();

for (const currency of CURRENCIES) {
    currencyLookup.set(currency.code.toLowerCase(), currency);
    for (const alias of currency.aliases || []) {
        currencyLookup.set(String(alias).toLowerCase().trim(), currency);
    }
}

const getCurrencyByCode = (code) => {
    if (!code) {
        return null;
    }

    return currencyLookup.get(String(code).trim().toLowerCase()) || null;
};

const normalizeCurrencyCode = (value) => {
    const currency = getCurrencyByCode(value);

    if (!currency) {
        return null;
    }

    return currency.code;
};

const getCurrencySymbol = (code) => getCurrencyByCode(code)?.symbol || "";

const getCurrencyName = (code) => getCurrencyByCode(code)?.name || "";

const formatCurrencyFields = (code) => {
    const currency = getCurrencyByCode(code) || getCurrencyByCode("PKR");

    return {
        currency: currency.code,
        currencySymbol: currency.symbol,
        currencyName: currency.name,
    };
};

const getAllowedCurrencies = () =>
    CURRENCIES.map(({ code, name, symbol }) => ({ code, name, symbol }));

export {
    CURRENCIES,
    CURRENCY_CODES,
    getCurrencyByCode,
    normalizeCurrencyCode,
    getCurrencySymbol,
    getCurrencyName,
    formatCurrencyFields,
    getAllowedCurrencies,
};
