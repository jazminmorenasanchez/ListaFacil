terraform {
  required_version = ">= 1.5"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0"
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
  }
}

provider "neon" {}

provider "render" {}

resource "neon_project" "preprod" {
  name                      = "listafacil-preprod"
  org_id                    = "org-floral-math-58970776"
  history_retention_seconds = 21600
}

resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod_owner"
}

resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

locals {
  database_user     = replace(urlencode(neon_role.preprod.name), "+", "%20")
  database_password = replace(urlencode(neon_role.preprod.password), "+", "%20")
  database_url = format(
    "postgresql://%s:%s@%s/%s?sslmode=require&schema=public",
    local.database_user,
    local.database_password,
    neon_project.preprod.database_host,
    neon_database.preprod.name,
  )
}

resource "render_web_service" "api" {
  name              = "listafacil-api-preprod"
  plan              = "free"
  region            = var.region
  health_check_path = "/health"

  runtime_source = {
    image = {
      image_url = var.image_repo_api
      tag       = var.image_tag
    }
  }

  env_vars = {
    DATABASE_URL = { value = local.database_url }
    JWT_SECRET   = { generate_value = true }
  }
}

resource "render_web_service" "front" {
  name   = "listafacil-web-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    BACKEND_URL  = { value = trimsuffix(render_web_service.api.url, "/") }
    DNS_RESOLVER = { value = "8.8.8.8" }
  }
}
