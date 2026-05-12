"""Console endpoints scoped to guest users.

This package exposes the routes that guest accounts (``TenantAccountRole.GUEST``)
use to list and consume the apps assigned to them. Endpoints here verify the
caller is a guest AND has an active assignment for the requested app.
"""
