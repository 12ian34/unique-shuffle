#!/usr/bin/env node

/**
 * This script removes test API routes before production builds
 * It should be run as part of the build process
 */

const fs = require('fs');
const path = require('path');

// Routes to be removed before production build
const testRoutes = [
  'src/app/api/shuffles/test-insert',
  'src/app/api/shuffles/fix-constraint'
];

// Check if the route exists and remove it
function removeRoute(routePath) {
  const fullPath = path.resolve(process.cwd(), routePath);
  
  if (fs.existsSync(fullPath)) {
    // If it's a directory, remove recursively
    if (fs.statSync(fullPath).isDirectory()) {
      console.log(`Removing test route directory: ${routePath}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    } 
    // If it's a file, remove it directly
    else {
      console.log(`Removing test route file: ${routePath}`);
      fs.unlinkSync(fullPath);
    }
    return true;
  } else {
    console.log(`Test route not found (already removed): ${routePath}`);
    return false;
  }
}

// Main function
function cleanupTestRoutes() {
  console.log('Cleaning up test API routes before production build...');
  
  let removedCount = 0;
  
  // Remove each test route
  for (const route of testRoutes) {
    if (removeRoute(route)) {
      removedCount++;
    }
  }
  
  console.log(`Removed ${removedCount} test routes`);
}

// Run the cleanup
cleanupTestRoutes(); 