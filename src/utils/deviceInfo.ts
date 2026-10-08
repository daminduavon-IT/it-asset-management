export function getDeviceInfo() {
  const userAgent = window.navigator.userAgent;
  let browserName = 'Unknown Browser';
  let osName = 'Unknown OS';

  // Detect Browser — Edge and Opera also contain "Chrome", and Chrome contains "Safari", so check the specific ones first
  if (userAgent.match(/edg(e|a|ios)?\//i)) {
    browserName = 'Edge';
  } else if (userAgent.match(/opr\/|opera/i)) {
    browserName = 'Opera';
  } else if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = 'Chrome';
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = 'Firefox';
  } else if (userAgent.match(/safari/i)) {
    browserName = 'Safari';
  }

  // Detect OS — Android UAs contain "Linux" and iOS UAs contain "Mac OS X", so check mobile first
  if (userAgent.match(/android/i)) {
    osName = 'Android';
  } else if (userAgent.match(/iphone|ipad|ipod/i)) {
    osName = 'iOS';
  } else if (userAgent.match(/windows nt 10/i)) {
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
  }

  return { browser: browserName, os: osName, userAgent };
}
