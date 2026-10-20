variable "image_repo_api" {
  type    = string
  default = "ghcr.io/jazminmorenasanchez/listafacil-backend"
}

variable "image_repo_front" {
  type    = string
  default = "ghcr.io/jazminmorenasanchez/listafacil-frontend"
}

variable "image_tag" {
  type    = string
  default = "sha-2f56447d315e1ac99bdab2591313c9c9fde522e5"
}

variable "region" {
  type    = string
  default = "oregon"
}
