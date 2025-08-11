export const debugLog = {
  query: (name: string, data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Query: ${name}`);
      console.log('Data:', data);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },
  
  error: (name: string, error: any, context?: any) => {
    console.group(`❌ Error: ${name}`);
    console.error('Error:', error);
    if (context) {
      console.log('Context:', context);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.trace();
    console.groupEnd();
  },
  
  success: (name: string, result: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Success: ${name}`, result);
    }
  },

  api: (method: string, url: string, status: number, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const emoji = status >= 400 ? '🚨' : status >= 300 ? '⚠️' : '✅';
      console.group(`${emoji} API ${method.toUpperCase()}: ${url} (${status})`);
      if (data) {
        console.log('Response:', data);
      }
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },

  messaging: (event: string, data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`💬 Messaging: ${event}`);
      console.log('Data:', data);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },

  auth: (event: string, data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔐 Auth: ${event}`);
      console.log('Data:', data);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },

  realtime: (channel: string, event: string, payload: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`📡 Realtime: ${channel} -> ${event}`);
      console.log('Payload:', payload);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }
};

export const performanceLog = {
  start: (name: string): number => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`⏱️ ${name}`);
      return performance.now();
    }
    return 0;
  },

  end: (name: string, startTime?: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`⏱️ ${name}`);
      if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`📊 ${name} took ${duration.toFixed(2)}ms`);
      }
    }
  }
};