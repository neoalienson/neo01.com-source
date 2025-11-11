---
title: JenkinsパイプラインでのGitOps
date: 2023-09-25
tags:
  - GitOps
  - Jenkins
  - Groovy
categories:
  - Development
spell_checked: 2025-01-01
grammar_checked: 2025-07-01
lang: ja
excerpt: "午前3時にデプロイが失敗？git revertして再デプロイするだけ！シーダースクリプトを使用してJenkinsパイプラインをコードとして管理する方法を、状態管理パターンとセキュリティのベストプラクティスとともに学びます。"
thumbnail: /assets/jenkins/thumbnail.png
---

## GitOpsとは？

こんな状況を想像してください：午前3時、デプロイが失敗しました。Jenkins UIを慌ててクリックして何を変更したか思い出そうとする代わりに、単に`git revert`を実行して再デプロイするだけです。これがGitOpsの力です。

GitOpsとは、Gitでコードを管理するのと同じように、インフラストラクチャ全体を管理することを意味します。すべての変更が追跡され、すべてのデプロイが再現可能で、すべてのロールバックがコミット一つで完了します。

GitOpsは、Gitを唯一の信頼できる情報源として使用してインフラストラクチャとアプリケーションを管理する方法です。望ましい状態をコードで定義し、ツールを使用してその状態を環境に適用できます。GitOpsは継続的デリバリーを可能にし、Gitリポジトリでの変更がコードの新しいバージョンをデプロイするパイプラインをトリガーします。

{% mermaid %}
graph LR
    A([開発者]) -->|コミット| B[(Gitリポジトリ)]
    B -->|トリガー| C[CI/CDパイプライン]
    E[(オブジェクトストア)] -->|状態を読み取り| C
    C -->|デプロイ| D[インフラストラクチャ]
    D -->|状態を書き込み| E
    
    style B fill:#87CEEB
    style C fill:#90EE90
    style D fill:#FFD700
    style E fill:#FFA07A
{% endmermaid %}

## JenkinsパイプラインのためのGitOps

Jenkinsパイプラインのコンテキストでは、GitOpsを使用してパイプライン設定をコードとして扱い、Gitを使用してそのコードへの変更を管理することでパイプラインを管理できます。これにより、開発者はパイプライン設定をバージョン管理し、他のチームメンバーと変更について協力し、必要に応じて変更を簡単にロールバックできます。

このように考えてください：Jenkins UIを手動でクリックしてパイプラインを作成・設定する代わりに、どのようなパイプラインが必要かを記述するコードを書き、それをGitにコミットし、自動化に作成させます。

### シーダースクリプトによるJenkinsパイプラインの管理

シーダースクリプトは、Jenkins上でパイプラインを作成・維持するためのスクリプトです。通常、Groovyスクリプトで書かれています。

以下は、Jenkinsでパイプラインを作成するシーダースクリプトの例です。このスクリプトはJob DSLプラグインを使用して、宣言的な方法でパイプラインジョブを定義します。スクリプトはリポジトリのリストをループし、それぞれに対してパイプラインジョブを作成します。各パイプラインのステップの詳細は、それぞれのリポジトリ内のJenkinsfileから参照されます。

{% codeblock lang:groovy %}
// リポジトリのリストを定義
def repositories = ['repo1', 'repo2', 'repo3']

// リストをループして各リポジトリのパイプラインジョブを作成
repositories.each { repo ->
  pipelineJob("${repo}-pipeline") {
    // SCMトリガーを使用してリポジトリに変更があったときにジョブを実行
    triggers {
      scm('H/5 * * * *')
    }
    // パイプラインスクリプトのパスをリポジトリのルートにあるJenkinsfileとして定義
    definition {
      cpsScm {
        scm {
          git {
            remote {
              url("https://github.com/${repo}.git")
            }
            branch('master')
          }
        }
        scriptPath('Jenkinsfile')
      }
    }
  }
}
{% endcodeblock %}

3つのパイプラインは印象的ではないかもしれません。しかし、複数の環境用のパイプラインを作成することを考えてみてください。これこそがシーダースクリプトが真に輝く場面です：

{% codeblock lang:groovy %}
// リポジトリと環境のリストを定義
def repositories = ['repo1', 'repo2', 'repo3']
def environments = ['dev', 'test', 'prod']

// リストをループして各組み合わせのパイプラインを作成
for (repo in repositories) {
  for (env in environments) {
    // パイプライン名と説明を定義
    def pipelineName = "${repo}-${env}"
    def pipelineDesc = "${env}環境の${repo}用パイプライン"

    // DSLプラグインを使用してパイプラインジョブを作成
    pipelineJob(pipelineName) {
      description(pipelineDesc)
      // リポジトリのJenkinsfileをパイプライン定義のソースとして使用
      definition {
        cpsScm {
          scm {
            git {
              remote {
                url("https://github.com/${repo}.git")
              }
              branch('master')
            }
          }
          // リポジトリ内のJenkinsfileへのパスを指定
          scriptPath("Jenkinsfile-${env}")
        }
      }
    }
  }
}
{% endcodeblock %}

シーダースクリプトを使用してパイプラインの詳細なステップを定義することもできますが、これらのスクリプトをシンプルに保ち、パイプラインの管理に集中させることが重要です。シーダースクリプトをシンプルに保つことで、保守が容易になり、他のチームメンバーとの協力がしやすくなります。

!!!tip "💡 ベストプラクティス"
    シーダースクリプトはパイプラインの構造と設定に集中させましょう。実際のパイプラインロジックは各リポジトリ内のJenkinsfileに保存します。この関心の分離により、両方の保守が容易になります。

### シーダースクリプトを使用するGitOpsの利点

シーダースクリプトを使用することで、以下のような複数の利点があります：

- **自動化**: Gitリポジトリの変更に基づいて、Jenkinsパイプラインの作成と更新を自動化できます。これにより、手動エラーが減少し、時間と労力が節約されます。
- **不変性**: Jenkinsパイプラインを不変に保つことができます。つまり、作成後に手動で変更されることはありません。これにより、異なる環境やステージ間での一貫性と信頼性が確保されます。
- **バージョン管理**: Gitのコミットとブランチを使用して、Jenkinsパイプラインの履歴と変更を追跡できます。これにより、以前のバージョンへのロールバック、異なるバージョンの比較、変更の監査が可能になります。
- **コラボレーション**: プルリクエスト、コードレビュー、マージコンフリクトなどのGit機能を使用して、Jenkinsパイプラインについて他の開発者やチームと協力できます。これにより、パイプラインの品質とセキュリティが向上します。
- **復旧**: Jenkinsが破損したり誤って削除されたりした場合、シーダージョブを使用してGitリポジトリからパイプラインを再デプロイできます。
- **移植性**: GitOpsを使用して、別のJenkinsサーバーに同じパイプラインセットを作成できます。これは、Jenkins/プラグインのアップグレードでパイプラインをテストしたい場合に特に便利です。

### 高度なパターン：動的パイプライン生成

組織が成長するにつれて、より洗練されたパターンが必要になる場合があります。以下は、YAMLファイルからパイプライン設定を読み取る例です：

{% codeblock lang:groovy %}
// リポジトリ内のYAMLファイルからパイプライン設定を読み取る
import org.yaml.snakeyaml.Yaml

def yaml = new Yaml()
def config = yaml.load(readFileFromWorkspace('pipelines.yaml'))

// 設定に基づいてパイプラインを作成
config.pipelines.each { pipeline ->
  pipelineJob(pipeline.name) {
    description(pipeline.description)
    
    // 定義されている場合はパラメータを設定
    if (pipeline.parameters) {
      parameters {
        pipeline.parameters.each { param ->
          stringParam(param.name, param.defaultValue, param.description)
        }
      }
    }
    
    definition {
      cpsScm {
        scm {
          git {
            remote {
              url(pipeline.repository)
              credentials(pipeline.credentials)
            }
            branch(pipeline.branch ?: 'main')
          }
        }
        scriptPath(pipeline.jenkinsfile ?: 'Jenkinsfile')
      }
    }
  }
}
{% endcodeblock %}

対応する`pipelines.yaml`：

{% codeblock lang:yaml %}
pipelines:
  - name: microservice-api-prod
    description: APIサービスの本番デプロイ
    repository: https://github.com/company/api-service.git
    branch: main
    jenkinsfile: deploy/Jenkinsfile.prod
    credentials: github-token
    parameters:
      - name: VERSION
        defaultValue: latest
        description: デプロイするバージョン
      - name: ENVIRONMENT
        defaultValue: production
        description: ターゲット環境
{% endcodeblock %}

### 課題と解決策

しかし、GitOpsを使用してJenkinsパイプラインを生成する際には、注意すべき課題もあります。

!!!warning "⚠️ パイプラインの削除と監査ログ"
    GitOpsを使用してJenkinsパイプラインを生成する場合、不要になったパイプラインを破棄するためにもGitOpsを使用することがあります。しかし、監査やトラブルシューティングのためにパイプライン実行の出力（コンソールログ）を保持する必要がある場合、これは問題を引き起こす可能性があります。

**検討すべき解決策：**

1. **外部ログストレージ**: Elasticsearch、CloudWatch、S3などの別のストレージシステムを使用して、パイプライン削除前にログをアーカイブ
2. **ソフト削除**: パイプラインをすぐに削除するのではなく、非推奨としてマーク
3. **保持ポリシー**: 設定可能な保持期間で自動アーカイブを実装

{% codeblock lang:groovy %}
// 例：削除前にログをアーカイブ
def archivePipelineLogs(pipelineName) {
  def builds = Jenkins.instance.getItemByFullName(pipelineName).builds
  builds.each { build ->
    // S3または外部ストレージにアーカイブ
    archiveToS3(build.logFile, "jenkins-logs/${pipelineName}/${build.number}")
  }
}
{% endcodeblock %}

### セキュリティに関する考慮事項

!!!danger "🔒 セキュリティのベストプラクティス"
    パイプライン設定がGitに保存されるため、GitOpsは新しいセキュリティ上の考慮事項をもたらします。

**主要なセキュリティプラクティス：**

- **認証情報管理**: シーダースクリプトに認証情報を保存しないでください。Jenkins Credentials Pluginを使用し、IDで参照します
- **アクセス制御**: ブランチ保護を実装し、シーダースクリプトの変更にはコードレビューを必須にします
- **監査証跡**: Gitコミット署名を有効にして変更の真正性を検証します
- **最小権限**: シーダージョブにはパイプラインの作成/更新に必要な権限のみを付与します

{% codeblock lang:groovy %}
// 良い例：IDで認証情報を参照
credentials('github-api-token')

// 悪い例：絶対にこれをしないでください！
// credentials('username', 'hardcoded-password')
{% endcodeblock %}

### シーダースクリプトのテスト

本番Jenkinsにシーダースクリプトをデプロイする前に、サンドボックス環境でテストします：

{% codeblock lang:groovy %}
// シーダースクリプトにドライランモードを追加
def dryRun = System.getenv('DRY_RUN') == 'true'

repositories.each { repo ->
  if (dryRun) {
    println "パイプラインを作成します: ${repo}-pipeline"
  } else {
    pipelineJob("${repo}-pipeline") {
      // ... 実際のパイプライン作成
    }
  }
}
{% endcodeblock %}

### モニタリングと可観測性

GitOpsで管理されたパイプラインの健全性を追跡します：

- **パイプライン作成メトリクス**: 作成/更新/削除されたパイプラインの数を監視
- **同期ステータス**: Git状態とJenkins状態が一致していることを確認
- **障害アラート**: シーダージョブが失敗したときに通知を受け取る

{% mermaid %}
graph TD
    A[Gitコミット] -->|Webhook| B[シーダージョブ]
    B -->|成功| C[メトリクスを更新]
    B -->|失敗| D[アラートを送信]
    C --> E[ダッシュボード]
    D --> F[運用チーム]
    E --> G{ドリフト検出?}
    G -->|はい| H[調整]
    G -->|いいえ| I[健全な状態]
    
    style B fill:#87CEEB
    style C fill:#90EE90
    style D fill:#FFB6C6
{% endmermaid %}

### 状態管理パターン

GitOps実装が成熟するにつれて、状態の処理方法を決定する必要があります。状態とは、実際にデプロイされているものとGitで定義されているものの記録です。

!!!anote "📦 状態同期：オブジェクトストア vs Gitバージョニング"
    GitOpsは伝統的にGitを状態管理に使用しますが、一部のチームはGitでバージョン管理する代わりにオブジェクトストア（S3、Azure Blob）に状態を保存します。
    
    **なぜ状態にオブジェクトストアを使用するのか？**
    
    - **サイズ制限**: Terraformの状態ファイルや大きな設定出力はGitリポジトリを肥大化させ、クローンを遅くし、履歴を扱いにくくします
    - **バイナリデータ**: 状態ファイルには、Gitの差分機能の恩恵を受けないバイナリまたは頻繁に変更されるデータが含まれることがよくあります
    - **並行性**: ロック機構を持つオブジェクトストア（S3 + DynamoDBなど）は、Gitのマージコンフリクトよりも並行変更を防ぐのに優れています
    - **パフォーマンス**: 大きな状態ファイルの読み書きは、Git操作よりもオブジェクトストアの方が高速です
    - **関心の分離**: 設定（Git）とランタイム状態（オブジェクトストア）は根本的に異なります。一方は意図、もう一方は現実です
    
    建築計画と検査報告書のようなものと考えてください：設計図（Git）はバージョン管理しますが、検査結果はファイリングキャビネット（オブジェクトストア）に保存します。

Jenkinsに焦点を当ててきましたが、同じ状態管理の原則は他のインフラストラクチャツールにも適用されます。Terraformがこれをどのように処理するか見てみましょう：

#### 状態管理の例：S3バックエンドを使用したTerraform

Terraformのようなツールは、オブジェクトストアへの状態保存をネイティブにサポートしています。以下は、インフラストラクチャコードをGitに保持しながら、状態にS3を使用するようにTerraformを設定する方法です：

{% codeblock lang:hcl %}
# backend.tf - Gitに保存
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "jenkins/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
{% endcodeblock %}

{% codeblock lang:hcl %}
# main.tf - Gitのインフラストラクチャコード
resource "aws_instance" "jenkins" {
  ami           = "ami-12345678"
  instance_type = "t3.medium"
  
  tags = {
    Name = "Jenkins-Server"
  }
}
{% endcodeblock %}

この設定では：
- **Gitが保存**: インフラストラクチャコード（望むもの）
- **S3が保存**: 状態ファイル（持っているもの）
- **DynamoDB**: 並行変更を防ぐための状態ロックを提供

### 実例：マルチチームパイプライン管理

大規模な組織では、異なるチームが異なるパイプラインパターンを必要とする場合があります：

{% codeblock lang:groovy %}
// チーム固有のパイプラインテンプレート
def teamConfigs = [
  'backend': [
    jenkinsfile: 'ci/Jenkinsfile.backend',
    agents: ['docker'],
    stages: ['build', 'test', 'security-scan', 'deploy']
  ],
  'frontend': [
    jenkinsfile: 'ci/Jenkinsfile.frontend',
    agents: ['nodejs'],
    stages: ['build', 'test', 'e2e', 'deploy']
  ],
  'data': [
    jenkinsfile: 'ci/Jenkinsfile.data',
    agents: ['python'],
    stages: ['validate', 'test', 'deploy']
  ]
]

// 設定からチームリポジトリを読み取る
def repositories = readJSON(file: 'team-repos.json')

repositories.each { repo ->
  def teamConfig = teamConfigs[repo.team]
  
  pipelineJob("${repo.team}-${repo.name}") {
    description("${repo.name}の${repo.team}チームパイプライン")
    
    definition {
      cpsScm {
        scm {
          git {
            remote {
              url(repo.url)
              credentials("${repo.team}-github-token")
            }
            branch(repo.branch ?: 'main')
          }
        }
        scriptPath(teamConfig.jenkinsfile)
      }
    }
    
    // チーム固有の設定
    properties {
      pipelineTriggers {
        triggers {
          githubPush()
        }
      }
    }
  }
}
{% endcodeblock %}

## Jenkinsを超えて：あらゆる場所でGitOps

GitOpsは、Gitを唯一の信頼できる情報源として使用して、すべての運用を自動化するために適用できる概念です。Jenkinsはアプリケーションの一つに過ぎません。同じ原則は以下にも適用されます：

- **Infrastructure as Code**: Terraform、CloudFormation、Pulumi
- **Kubernetes**: ArgoCD、Fluxによるクラスター管理
- **構成管理**: Ansible、Chef、Puppet
- **モニタリング**: Grafanaダッシュボード、Prometheusルール

!!!success "✨ 重要なポイント"
    GitOpsは、手動でエラーが発生しやすいプロセスを、自動化され、監査可能で、再現可能なワークフローに変換します。すべてをコードとして扱い、Gitを信頼できる情報源として使用することで、インフラストラクチャ全体のバージョン管理、コラボレーション、信頼性を獲得できます。

!!!tip "🚀 はじめに"
    Jenkinsパイプラインにギットオプスを実装する準備はできましたか？
    
    1. **小さく始める**: 手動パイプラインを1つシーダースクリプトに変換
    2. **サンドボックスでテスト**: まず非本番のJenkinsインスタンスを使用
    3. **徐々に拡大**: 慣れてきたらパイプラインを追加
    4. **可観測性を追加**: 安定したらモニタリングとアラートを実装
    5. **パターンを文書化**: チームが従うテンプレートを作成
