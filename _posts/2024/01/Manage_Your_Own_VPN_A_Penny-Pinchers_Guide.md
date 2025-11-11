---
title: Manage Your Own VPN - A Penny-Pincher's Guide
date: 2024-1-12
updated: 2024-5-7
categories:
  - Development
tag:
  - cloud
  - Google
  - Azure
  - terraform
thumbnail: index_head.jpeg
thumbnail_80: thumbnail_80.jpeg
excerpt: Ditch the VPN subscription and start living like a digital nomad - minus the Instagram-worthy coffee shop vibes. Just grab a pay-as-you-go cloud VPN and wing it (your wallet will thank you)!
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
---

![](index_head.jpeg)

Ah, the internet – a vast expanse of knowledge and cat videos. But as you navigate this digital sea, you might find yourself wanting a bit more privacy, or perhaps you're just tired of being told what content you can and cannot view based on your location...

## Problem with VPN and Proxy Service Pricing Model

Let's have a quick look at the VPN service price as of Oct 2025

|VPN Provider|Price per month (USD)|Price with subscription per month (USD)|
|---|---|---|
|Surfshark (Starter)|$15.45|$1.99 for 2 years subscription|
|ExpressVPN (Basic)|$12.99|3.49 for 2 years subscription|

The best pay-as-you-go option is per month. Per usage pay-as-you-go model does not exist and we are forced to adopt a subscription-based model. A subscription-based model is like hiring a bodyguard who insists on a year-long contract when you only need someone to watch your back during that shady walk home once a month. A Penny Pincher like me does not accept this subscription offer.

## On Demand Cloud Proxy

Now, let us examine the available cloud services for your VPN/proxy adventures. You can create a VPN/proxy server on Cloud. For simplicity, let's start with a proxy server on Google Cloud. Here's how it is going to work:

{% mermaid %}
flowchart LR
pc["Your PC\nin Country A\n\n"]
ssh["SSH tunnel\n\n"]
pc-->ssh
proxy["Proxy on Google Cloud\nin Country B\n\n"]
ssh-->proxy
target["Target Website\n\n"]
proxy-->target
{% endmermaid %}

The flowchart illustrates the setup of a proxy server on Google Cloud. Your PC (PC) is in Country A, and you want to access a target website (target) that is restricted or has content blocked by your location. You establish an SSH tunnel (ssh) from your PC to the proxy server (proxy) on Google Cloud, which is located in Country B. This allows you to bypass geographical restrictions and access the target website as if you were in Country B.

### Provider 1. Google Cloud

Below are the Terraform scripts to create a compute engine with the proxy (squid) on Google Cloud. 

{% codeblock main.tf lang:hcl line_number:true %}
resource "google_compute_instance" "default" {
  name         = "proxy-server"
  machine_type = "e2-micro"
  zone         = "us-west1-a"
  tags         = ["ssh"]

  scheduling {
    provisioning_model = "SPOT"
    automatic_restart  = false
    preemptible        = true
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral public IP
      network_tier = "STANDARD"
    }
  }

  service_account {
    scopes = ["cloud-platform"]
  }

  metadata = {
    ssh-keys       = format("%s:%s", var.ssh_username, var.ssh_public_key)
    startup-script = "sudo apt-get update;sudo apt-get install -y squid;sudo systemctl start squid"
  }
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/modules/google/main.tf

{% codeblock variables.tf lang:hcl line_number:true %}
variable "ssh_username" {
  type        = string
  description = "username of SSH to the compute engine"
}

variable "ssh_public_key" {
  type        = string
  description = "Public key for SSH"
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/modules/google/variables.tf

{% codeblock output.tf lang:hcl line_number:true %}
output "ip" {
  value = google_compute_instance.default.network_interface.0.access_config.0.nat_ip
}

output "command" {
  description = "Command to setup ssh tunnel to the proxy server"
  value = format("ssh-keygen -R %s; ssh -L3128:localhost:3128 %s@%s",
    google_compute_instance.default.network_interface.0.access_config.0.nat_ip,
    var.ssh_username,
  google_compute_instance.default.network_interface.0.access_config.0.nat_ip)
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/modules/google/output.tf

Run `terraform apply`:

{% codeblock lang:shell-session line_number:false %}
$ terraform apply

var.google_access_credentials
  The json file that contains key of your service account in Google Cloud

  Enter a value: a.josn

var.project
  Google Cloud Project Name

  Enter a value: a

var.ssh_public_key
  Public key for SSH

  Enter a value: ssh-rsa AAAAB...

var.ssh_username
  username of SSH to the compute engine

  Enter a value: neo

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the
following symbols:
  + create

Terraform will perform the following actions:

  # google_compute_instance.default will be created
  + resource "google_compute_instance" "default" {
      ...
      + machine_type         = "e2-micro"
      + metadata             = {
          + "ssh-keys"       = "neo:ssh-rsa AAAAB..."
          + "startup-script" = "sudo apt-get update;sudo apt-get install -y squid;sudo systemctl start squid"
        }
      ...
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + command = (known after apply)
  + ip      = (known after apply)

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

google_compute_instance.default: Creating...
google_compute_instance.default: Still creating... [10s elapsed]
google_compute_instance.default: Creation complete after 17s [id=projects/a/zones/us-west1-a/instances/proxy-server]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

command = "ssh -L3128:localhost:3128 neo@123.123.123.123"
ip = "123.123.123.123"
{% endcodeblock %}

To set up an SSH tunnel to the proxy, use the command provided in the output `command`. You may need to wait a few moments until the proxy is ready. Once the proxy is ready, your browser can use `localhost:3128` as the proxy. 

When a cloud service reuses an IP address to create a new compute instance, you may experience a host validation error if you had SSH to the IP address before. This occurs because the new compute instance generates a new host key, which does not match the key you trusted in `.ssh/known_hosts`. To resolve this issue, you can either remove the trusted host key using `ssh-keygen -R` or send the private key from your local machine to the new compute instance.

Remember to destroy the compute engine once you have finished with it: 

{% codeblock lang:shell-session line_number:false %}
$ terraform destroy

google_compute_instance.default: Refreshing state... [id=projects/f-01man-com/zones/us-west1-a/instances/proxy-server]

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the
following symbols:
  - destroy

Terraform will perform the following actions:

  # google_compute_instance.default will be destroyed
  - resource "google_compute_instance" "default" {
      ...
    }

Plan: 0 to add, 0 to change, 1 to destroy.

Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes

google_compute_instance.default: Destroying... [id=projects/a/zones/us-west1-a/instances/proxy-server]
google_compute_instance.default: Still destroying... [id=projects/a/zones/us-west1-a/instances/proxy-server, 10s elapsed]
google_compute_instance.default: Destruction complete after 16s

Destroy complete! Resources: 1 destroyed.
{% endcodeblock %}

Given my extremely low usage, like 30 minutes a month, Google charges me around USD $0.20 a month. However, that doesn't stop me from exploring other cheaper alternatives.

### Provider 2. Azure

{% codeblock main.tf lang:hcl line_number:true %}
resource "azurerm_resource_group" "rg" {
  name     = "squid-rg"
  location = "West US"
}

resource "azurerm_virtual_machine" "proxy" {
  name = "squid-proxy-vm"

  # charge you if you dont delete
  delete_data_disks_on_termination = true
  delete_os_disk_on_termination    = true

  resource_group_name   = azurerm_resource_group.rg.name
  location              = azurerm_resource_group.rg.location
  network_interface_ids = [azurerm_network_interface.nic.id]
  vm_size               = "Standard_B1s"
  storage_os_disk {
    name              = "os"
    caching           = "ReadWrite"
    managed_disk_type = "Standard_LRS"
    create_option     = "FromImage"
    os_type           = "Linux"
  }

  storage_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  os_profile {
    admin_username = var.ssh_username
    computer_name  = "proxy"
    custom_data = base64encode(<<CUSTOM_DATA
#!/bin/bash
sudo apt-get update;sudo apt-get install -y squid;sudo systemctl start squid
    CUSTOM_DATA
    )
  }

  os_profile_linux_config {
    disable_password_authentication = true
    ssh_keys {
      path = "/home/${var.ssh_username}/.ssh/authorized_keys"
      key_data = var.ssh_public_key
    }
  }
}

resource "azurerm_network_interface" "nic" {
  name                = "squid-nic"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  ip_configuration {
    name                          = "squid-ipconfig"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.proxy.id
  }
}

resource "azurerm_subnet" "subnet" {
  name                 = "squid-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.0.0/24"]
}

resource "azurerm_virtual_network" "vnet" {
  name                = "squid-vnet"
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = ["10.0.0.0/8"]
  location            = "West US"
}

resource "azurerm_public_ip" "proxy" {
  name                = "squidPublicIp1"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  allocation_method   = "Static"

  lifecycle {
    create_before_destroy = true
  }
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/modules/azure/main.tf

{% codeblock variables.tf lang:hcl line_number:true %}
variable "ssh_username" {
    type        = string
    description = "username of SSH to the compute engine"
}

variable "ssh_public_key" {
    type       = string
    description = "Public key for SSH"
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/modules/azure/variables.tf

{% codeblock output.tf lang:hcl line_number:true %}
output "ip" {
    value = azurerm_public_ip.proxy.ip_address
}

output "command" {
    description = "Command to setup ssh tunnel to the proxy server"
    value       = format("ssh-keygen -R %s; ssh -L3128:localhost:3128 %s@%s",
      azurerm_public_ip.proxy.ip_address,
      var.ssh_username,
      azurerm_public_ip.proxy.ip_address)
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/modules/azure/output.tf

It takes time to create and destroy. You can check `/var/log/cloud-init.log` and look for `subp.py` and `part` to troubleshoot, e.g.:

{% codeblock line_number:false %}
2024-05-07 14:14:02,864 - subp.py[DEBUG]: Running command ['/var/lib/cloud/instance/scripts/part-001'] with allowed return codes [0] (shell=False, capture=False)
2024-05-07 14:14:02,864 - subp.py[DEBUG]: Exec format error. Missing #! in script?
Command: ['/var/lib/cloud/instance/scripts/part-001']
Exit code: -
Reason: [Errno 8] Exec format error: b'/var/lib/cloud/instance/scripts/part-001'
{% endcodeblock %}

### Other Cloud Service Provider

I have also tried Alibaba Cloud and Huawei Cloud. However, Alibaba Cloud requires account verification after a few uses of IP addresses and resources from a country other than China, which asks me to upload my passport, etc. Also, the minimum compute service is monthly instead of consumption-based like Google Cloud.

On the other hand, Huawei Cloud is better; compute service can be consumption-based. However, bandwidth charges are per day subscription and not metered, resulting in a daily fee of USD 2! Therefore, I do not recommend Alibaba Cloud and Huawei Cloud for those who are Penny Pinchers.

### Cloud Agnostic Terraform Script

Now we have 2 cloud provider options, Azure and Google. We want to create cloud-agnostic Terraform scripts because it allows us to maintain a single set of code and apply it across multiple cloud providers. This approach allows us to easily switch between different cloud service providers if needed. A cloud-agnostic architecture plus money saving!

Let's structure the folder as below:

```
\ - root
    \ - main.tf
      - variables.tf
      - output.tf
      - provider.tf
    \ - modules
        \ - google
            \ - main.tf
              - variables.tf
              - output.tf
        \ - azure
            \ - main.tf
              - variables.tf
              - output.tf
```

The `root` folder serves as a cloud-agnostic abstract layer, while subfolders under `modules`, i.e., `modules/azure` and `modules/google`, serve as cloud-specific implementation. What you can expect from running `root` scripts is to provision a cloud server by providing your username and public key, and the return command to set up an SSH tunnel from the output. Use of which provider depends on the `cloud_service_provider` variable, either `azure` or `google` from the example. 

{% codeblock /variables.tf lang:hcl line_number:false %}
variable "cloud_service_provider" {
  type        = string
  description = "Cloud Service Provider: azure or google"

  validation {
    condition     = contains(["azure", "google"], var.cloud_service_provider)
    error_message = "Valid values for var: cloud_service_provider are (azure, google)."
  }
}

variable "ssh_username" {
  type        = string
  description = "username of SSH to the compute engine"
}

variable "ssh_public_key" {
  type        = string
  description = "Public key for SSH"
}

variable "google_project" {
  type        = string
  default     = "no project"
  description = "Google Cloud Project Name."
}

locals {
  # cross variables validation could be improved in Terraform v1.9.0
  # tflint-ignore: terraform_unused_declarations
  validate_project = (var.google_project == "no project" && var.cloud_service_provider == "google") ? tobool(
  "google_project must be provided when the provider is 'google'.") : true
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/variables.tf

`/main.tf` is very simple, it enables the module to implement cloud proxy per requirement and disable the other:

{% codeblock /main.tf lang:hcl line_number:true %}
module "azure_server" {
  source = "./modules/azure"
  count  = (var.cloud_service_provider == "azure") ? 1 : 0

  ssh_public_key = var.ssh_public_key
  ssh_username   = var.ssh_username
}

module "google_server" {
  source         = "./modules/google"
  count          = (var.cloud_service_provider == "google") ? 1 : 0
  ssh_public_key = var.ssh_public_key
  ssh_username   = var.ssh_username
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/main.tf

`/output.tf` is similar to `/main.tf`, which returns `ip` and `command` as well:

{% codeblock /output.tf lang:hcl line_number:true %}
output "ip" {
  value = (var.cloud_service_provider == "azure") ? module.azure_server[0].ip : module.google_server[0].ip
}

output "command" {
  description = "Command to setup ssh tunnel to the proxy server"
  value       = (var.cloud_service_provider == "azure") ? module.azure_server[0].command : module.google_server[0].command
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/output.tf

Providers in Terraform scripts are removed from modules and put together into `/provider.tf`.

{% codeblock /provider.tf lang:hcl line_number:true %}
terraform {
  required_providers {
    azapi = {
      source = "Azure/azapi"
    }
    azurerm = {
      source = "hashicorp/azurerm"
    }
    google = {
      source = "hashicorp/google"
    }
  }
}

provider "azapi" {
}

provider "azurerm" {
  features {}
}

provider "google" {
  project = var.google_project
  region  = "us-central1"
}
{% endcodeblock %}

https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/provider.tf

> Full source code: https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/

{% githubCard user:neoalienson repo:cloud_vpn_proxy %}

### Notification on Proxy Ready

*Coming soon...*

## Price comparison

### Azure

Virtual Machine
Virtual Network
Storage
Bandwidth

### Google Cloud

Compute Engine
Networking

*Coming soon...*

## VPN with WireGuard

*Coming soon...*

## User friendly on and off

*Coming soon...*

## Reminder to switch off

*Coming soon...*
