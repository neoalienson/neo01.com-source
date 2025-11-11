---
title: 自分のVPNを管理する - 節約家のためのガイド
date: 2024-1-12
updated: 2024-5-7
lang: ja
categories:
  - Development
tag:
  - cloud
  - Google
  - Azure
  - terraform
thumbnail: /2024/01/Manage_Your_Own_VPN_A_Penny-Pinchers_Guide/index_head.jpeg
thumbnail_80: /2024/01/Manage_Your_Own_VPN_A_Penny-Pinchers_Guide/thumbnail_80.jpeg
excerpt: "VPNサブスクリプションを捨てて、デジタルノマドのように生きよう - Instagramに映えるコーヒーショップの雰囲気は抜きで。従量課金制のクラウドVPNを手に入れて、気ままに使えばいい（財布が喜びます）！"
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
comments: true
---

![](/2024/01/Manage_Your_Own_VPN_A_Penny-Pinchers_Guide/index_head.jpeg)

ああ、インターネット - 知識と猫の動画の広大な空間。しかし、このデジタルの海を航海していると、もう少しプライバシーが欲しくなったり、あるいは単に場所に基づいて見られるコンテンツと見られないコンテンツを指示されることにうんざりしているかもしれません...

## VPNとプロキシサービスの価格モデルの問題

2025年10月時点のVPNサービス価格を簡単に見てみましょう。

|VPNプロバイダー|月額料金（USD）|サブスクリプション付き月額料金（USD）|
|---|---|---|
|Surfshark（Starter）|$15.45|2年間サブスクリプションで$1.99|
|ExpressVPN（Basic）|$12.99|2年間サブスクリプションで$3.49|

最良の従量課金制オプションは月単位です。使用量ベースの従量課金制モデルは存在せず、サブスクリプションベースのモデルを採用せざるを得ません。サブスクリプションベースのモデルは、月に一度だけ怪しい帰り道で背後を見守ってくれる人が必要なときに、1年契約を主張するボディーガードを雇うようなものです。私のような節約家は、このサブスクリプションオファーを受け入れません。

## オンデマンドクラウドプロキシ

それでは、VPN/プロキシアドベンチャーに利用可能なクラウドサービスを調べてみましょう。クラウド上にVPN/プロキシサーバーを作成できます。簡単にするために、Google Cloud上のプロキシサーバーから始めましょう。以下のように動作します：

{% mermaid %}
flowchart LR
pc["あなたのPC\n国A\n\n"]
ssh["SSHトンネル\n\n"]
pc-->ssh
proxy["Google Cloud上のプロキシ\n国B\n\n"]
ssh-->proxy
target["ターゲットWebサイト\n\n"]
proxy-->target
{% endmermaid %}

フローチャートは、Google Cloud上のプロキシサーバーのセットアップを示しています。あなたのPC（PC）は国Aにあり、場所によって制限されているか、コンテンツがブロックされているターゲットWebサイト（target）にアクセスしたいとします。PCから国BにあるGoogle Cloud上のプロキシサーバー（proxy）へのSSHトンネル（ssh）を確立します。これにより、地理的制限を回避し、国BにいるかのようにターゲットWebサイトにアクセスできます。

### プロバイダー1. Google Cloud

以下は、Google Cloud上にプロキシ（squid）を備えたコンピュートエンジンを作成するためのTerraformスクリプトです。

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

`terraform apply`を実行します：

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

プロキシへのSSHトンネルをセットアップするには、出力`command`で提供されるコマンドを使用します。プロキシの準備が整うまで数分待つ必要があるかもしれません。プロキシの準備が整ったら、ブラウザは`localhost:3128`をプロキシとして使用できます。

クラウドサービスがIPアドレスを再利用して新しいコンピュートインスタンスを作成する場合、以前にそのIPアドレスにSSH接続していた場合、ホスト検証エラーが発生する可能性があります。これは、新しいコンピュートインスタンスが新しいホストキーを生成し、`.ssh/known_hosts`で信頼したキーと一致しないために発生します。この問題を解決するには、`ssh-keygen -R`を使用して信頼されたホストキーを削除するか、ローカルマシンから新しいコンピュートインスタンスに秘密鍵を送信します。

使用が終わったら、コンピュートエンジンを破棄することを忘れないでください：

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

私の使用量は月に30分程度と非常に少ないため、Googleは月に約0.20米ドルを請求します。しかし、それでも他のより安価な代替手段を探すことを止めません。

### プロバイダー2. Azure

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

作成と破棄には時間がかかります。トラブルシューティングのために、`/var/log/cloud-init.log`を確認し、`subp.py`と`part`を探すことができます。例：

{% codeblock line_number:false %}
2024-05-07 14:14:02,864 - subp.py[DEBUG]: Running command ['/var/lib/cloud/instance/scripts/part-001'] with allowed return codes [0] (shell=False, capture=False)
2024-05-07 14:14:02,864 - subp.py[DEBUG]: Exec format error. Missing #! in script?
Command: ['/var/lib/cloud/instance/scripts/part-001']
Exit code: -
Reason: [Errno 8] Exec format error: b'/var/lib/cloud/instance/scripts/part-001'
{% endcodeblock %}

### その他のクラウドサービスプロバイダー

Alibaba CloudとHuawei Cloudも試しました。しかし、Alibaba Cloudは、中国以外の国からIPアドレスとリソースを数回使用した後、アカウント検証を要求し、パスポートなどのアップロードを求められます。また、最小のコンピュートサービスは、Google Cloudのような消費ベースではなく月単位です。

一方、Huawei Cloudの方が優れています。コンピュートサービスは消費ベースにできます。しかし、帯域幅料金は日単位のサブスクリプションで従量制ではないため、1日あたり2米ドルの料金が発生します！したがって、節約家の方には、Alibaba CloudとHuawei Cloudをお勧めしません。

### クラウド非依存のTerraformスクリプト

これで、AzureとGoogleの2つのクラウドプロバイダーオプションがあります。クラウド非依存のTerraformスクリプトを作成したいと考えています。これにより、単一のコードセットを維持し、複数のクラウドプロバイダーに適用できるためです。このアプローチにより、必要に応じて異なるクラウドサービスプロバイダー間を簡単に切り替えることができます。クラウド非依存のアーキテクチャに加えて、コスト削減も実現できます！

フォルダを以下のように構造化しましょう：

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

`root`フォルダはクラウド非依存の抽象レイヤーとして機能し、`modules`の下のサブフォルダ、つまり`modules/azure`と`modules/google`は、クラウド固有の実装として機能します。`root`スクリプトを実行することで期待できるのは、ユーザー名と公開鍵を提供してクラウドサーバーをプロビジョニングし、出力からSSHトンネルをセットアップするためのコマンドを返すことです。どのプロバイダーを使用するかは、例の`cloud_service_provider`変数（`azure`または`google`）に依存します。

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

`/main.tf`は非常にシンプルで、要件に応じてクラウドプロキシを実装するモジュールを有効にし、他のモジュールを無効にします：

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

`/output.tf`は`/main.tf`と同様で、`ip`と`command`も返します：

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

Terraformスクリプトのプロバイダーはモジュールから削除され、`/provider.tf`にまとめられます。

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

> 完全なソースコード：https://github.com/neoalienson/cloud_vpn_proxy/blob/main/server/

{% githubCard user:neoalienson repo:cloud_vpn_proxy %}

### プロキシ準備完了の通知

*近日公開...*

## 価格比較

### Azure

仮想マシン
仮想ネットワーク
ストレージ
帯域幅

### Google Cloud

Compute Engine
ネットワーキング

*近日公開...*

## WireGuardを使用したVPN

*近日公開...*

## ユーザーフレンドリーなオン/オフ

*近日公開...*

## オフにするリマインダー

*近日公開...*
