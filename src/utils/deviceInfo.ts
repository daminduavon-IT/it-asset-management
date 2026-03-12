export function getDeviceInfo() {
  const userAgent = window.navigator.userAgent;
  let browserName = 'Unknown Browser';
  let osName = 'Unknown OS';

  // Detect Browser
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = 'Chrome';
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = 'Firefox';
  } else if (userAgent.match(/safari/i)) {
    browserName = 'Safari';
  } else if (userAgent.match(/opr\//i)) {
    browserName = 'Opera';
  } else if (userAgent.match(/edg/i)) {
    browserName = 'Edge';
  }

  // Detect OS
  if (userAgent.match(/windows nt 10/i)) {
    osName = 'Windows 10/11';
  } else if (userAgent.match(/windows nt 6\.3/i)) {
    osName = 'Windows 8.1';
  } else if (userAgent.match(/windows nt 6\.2/i)) {
    osName = 'Windows 8';
  } else if (userAgent.match(/windows nt 6\.1/i)) {
    osName = 'Windows 7';
  } else if (userAgent.match(/macintosh|mac os x/i)) {
    osName = 'Mac OS';
  } else if (userAgent.match(/linux/i)) {
    osName = 'Linux';
  } else if (userAgent.match(/android/i)) {
    osName = 'Android';
  } else if (userAgent.match(/iphone|ipad|ipod/i)) {
    osName = 'iOS';
  }

  return { browser: browserName, os: osName, userAgent };
}
