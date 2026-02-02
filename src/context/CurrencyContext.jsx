import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [exchangeRates, setExchangeRates] = useState({
    usdToBsf: 7,        // 1 USD = 7 BSF (tipo de cambio de ejemplo)
    usdToArg: 1000,     // 1 USD = 1000 ARS (tipo de cambio de ejemplo)
    bsfToArg: 142.86    // 1 BSF = 142.86 ARS (derivado de los anteriores)
  });
  
  // Función para actualizar las tasas de cambio
  const updateExchangeRate = (rateName, newValue) => {
    setExchangeRates(prev => ({
      ...prev,
      [rateName]: parseFloat(newValue)
    }));
  };

  // Función para convertir un precio a diferentes monedas
  const convertPrice = (amount, fromCurrency, toCurrency) => {
    // Casos base
    if (fromCurrency === toCurrency) return amount;
    
    // Convertir a USD primero
    let amountInUSD = amount;
    if (fromCurrency === 'BSF') {
      amountInUSD = amount / exchangeRates.usdToBsf;
    } else if (fromCurrency === 'ARS') {
      amountInUSD = amount / exchangeRates.usdToArg;
    }
    
    // Convertir desde USD a la moneda objetivo
    let result = amountInUSD;
    if (toCurrency === 'BSF') {
      result = amountInUSD * exchangeRates.usdToBsf;
    } else if (toCurrency === 'ARS') {
      result = amountInUSD * exchangeRates.usdToArg;
    }
    
    return result;
  };

  // Formatear precios según la moneda
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 
               currency === 'BSF' ? 'BOB' : 
               'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Función para obtener el símbolo de la moneda
  const getCurrencySymbol = (currency) => {
    switch(currency) {
      case 'USD': return '$';
      case 'BSF': return 'Bs.';
      case 'ARS': return '$'; // Puede ser distinto para distinguir de USD
      default: return '';
    }
  };

  const value = {
    exchangeRates,
    updateExchangeRate,
    convertPrice,
    formatCurrency,
    getCurrencySymbol
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};