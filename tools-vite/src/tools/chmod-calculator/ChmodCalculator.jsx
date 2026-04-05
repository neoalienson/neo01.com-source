import React, { useState, useCallback, useMemo } from 'react';
import { ToolLayout } from '../../components/ToolLayout.jsx';
import { CopyButton } from '../../components/CopyButton.jsx';

const translations = {
  en: {
    title: "Chmod Calculator",
    filePermissions: "File Permissions:",
    owner: "Owner",
    group: "Group",
    others: "Others",
    read: "Read",
    write: "Write",
    execute: "Execute",
    octalNotation: "Octal Notation",
    symbolicNotation: "Symbolic Notation",
    umask: "Umask",
    orEnterOctal: "Or enter octal value:",
    copy: "Copy",
    copied: "Copied!",
    about: "About Chmod Calculator",
    description: "Chmod Calculator helps you understand and generate Unix/Linux file permission codes.",
    howItWorks: "How It Works",
    howItWorksText: "Unix permissions are divided into three groups: owner, group, and others.",
    commonUseCases: "Common Use Cases",
    useCase1: "Web server files (typically 644 for files, 755 for directories)",
    useCase2: "SSH keys (600 for private keys)",
    useCase3: "Deploying applications with correct executable permissions",
    useCase4: "Troubleshooting permission-denied errors",
    tip: "Tip: Check or uncheck the permission boxes to see the octal and symbolic notations update in real-time."
  },
  "zh-CN": {
    title: "chmod 计算器",
    filePermissions: "文件权限：",
    owner: "所有者",
    group: "组",
    others: "其他",
    read: "读取",
    write: "写入",
    execute: "执行",
    octalNotation: "八进制表示",
    symbolicNotation: "符号表示",
    umask: "Umask",
    orEnterOctal: "或输入八进制值：",
    copy: "复制",
    copied: "已复制！",
    about: "关于 chmod 计算器",
    description: "chmod 计算器帮助您理解和生成 Unix/Linux 文件权限代码。",
    howItWorks: "工作原理",
    howItWorksText: "Unix 权限分为三组：所有者、组和其他。",
    commonUseCases: "常见用例",
    useCase1: "Web 服务器文件",
    useCase2: "SSH 密钥",
    useCase3: "部署应用程序",
    useCase4: "排查权限错误",
    tip: "提示：勾选或取消勾选权限框可实时查看更新。"
  },
  "zh-TW": {
    title: "chmod 計算器",
    filePermissions: "檔案權限：",
    owner: "所有者",
    group: "群組",
    others: "其他",
    read: "讀取",
    write: "寫入",
    execute: "執行",
    octalNotation: "八進制表示",
    symbolicNotation: "符號表示",
    umask: "Umask",
    orEnterOctal: "或輸入八進制值：",
    copy: "複製",
    copied: "已複製！",
    about: "關於 chmod 計算器",
    description: "chmod 計算器幫助您理解和生成 Unix/Linux 檔案權限代碼。",
    howItWorks: "工作原理",
    howItWorksText: "Unix 權限分為三組：所有者、群組和其他。",
    commonUseCases: "常見用例",
    useCase1: "Web 服務器檔案",
    useCase2: "SSH 密鑰",
    useCase3: "部署應用程序",
    useCase4: "排查權限錯誤",
    tip: "提示：勾選或取消勾選權限框可即時查看更新。"
  }
};

function t(key, locale = 'en') {
  const trans = translations[locale] || translations.en;
  const keys = key.split('.');
  let value = trans;
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function calculateOctal(permissions) {
  const owner = permissions.owner;
  const group = permissions.group;
  const others = permissions.others;

  const ownerVal = (owner.read ? 4 : 0) + (owner.write ? 2 : 0) + (owner.execute ? 1 : 0);
  const groupVal = (group.read ? 4 : 0) + (group.write ? 2 : 0) + (group.execute ? 1 : 0);
  const othersVal = (others.read ? 4 : 0) + (others.write ? 2 : 0) + (others.execute ? 1 : 0);

  return `${ownerVal}${groupVal}${othersVal}`;
}

export function calculateSymbolic(permissions) {
  const getSymbolic = (p) => {
    return (p.read ? 'r' : '-') + (p.write ? 'w' : '-') + (p.execute ? 'x' : '-');
  };
  return getSymbolic(permissions.owner) + getSymbolic(permissions.group) + getSymbolic(permissions.others);
}

export function calculateUmask(octal) {
  return octal.split('').map(d => 7 - parseInt(d)).join('');
}

export function ChmodCalculator({ locale = 'en' }) {
  const [permissions, setPermissions] = useState({
    owner: { read: true, write: true, execute: false },
    group: { read: true, write: false, execute: false },
    others: { read: true, write: false, execute: false }
  });

  const [numericInput, setNumericInput] = useState('');

  const octal = useMemo(() => calculateOctal(permissions), [permissions]);
  const symbolic = useMemo(() => calculateSymbolic(permissions), [permissions]);
  const umask = useMemo(() => calculateUmask(octal), [octal]);

  const handleCheckboxChange = useCallback((group, permission, checked) => {
    setPermissions(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [permission]: checked
      }
    }));
  }, []);

  const handleNumericInputChange = useCallback((e) => {
    const value = e.target.value;
    setNumericInput(value);

    if (/^[0-7]{1,3}$/.test(value)) {
      const paddedValue = value.padStart(3, '0');
      const types = ['owner', 'group', 'others'];

      setPermissions(
        paddedValue.split('').reduce((acc, digit, index) => {
          const d = parseInt(digit);
          acc[types[index]] = {
            read: (d & 4) !== 0,
            write: (d & 2) !== 0,
            execute: (d & 1) !== 0
          };
          return acc;
        }, {})
      );
    }
  }, []);

  const PermissionCheckbox = ({ group, permission }) => (
    <input
      type="checkbox"
      checked={permissions[group][permission]}
      onChange={(e) => handleCheckboxChange(group, permission, e.target.checked)}
    />
  );

  const PermissionGroup = ({ group }) => (
    <div className="permission-checkboxes">
      <PermissionCheckbox group={group} permission="read" />
    </div>
  );

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label>{t('filePermissions', locale)}</label>
          <div className="permission-grid">
            <div></div>
            <div className="permission-header">{t('owner', locale)}</div>
            <div className="permission-header">{t('group', locale)}</div>
            <div className="permission-header">{t('others', locale)}</div>

            <div className="permission-label">{t('read', locale)}</div>
            <PermissionGroup group="owner" />
            <PermissionGroup group="group" />
            <PermissionGroup group="others" />

            <div className="permission-label">{t('write', locale)}</div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="owner" permission="write" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="group" permission="write" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="others" permission="write" />
            </div>

            <div className="permission-label">{t('execute', locale)}</div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="owner" permission="execute" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="group" permission="execute" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="others" permission="execute" />
            </div>
          </div>
        </div>

        <div className="output-section">
          <CopyButton text={octal} locale={locale} />
          <div className="output-label">{t('octalNotation', locale)}</div>
          <div className="output-content" id="octal-result">{octal}</div>
        </div>

        <div className="output-section">
          <CopyButton text={symbolic} locale={locale} />
          <div className="output-label">{t('symbolicNotation', locale)}</div>
          <div className="output-content" id="symbolic-result">{symbolic}</div>
        </div>

        <div className="output-section">
          <CopyButton text={umask} locale={locale} />
          <div className="output-label">{t('umask', locale)}</div>
          <div className="output-content" id="umask-result">{umask}</div>
        </div>

        <div className="input-group">
          <label htmlFor="numericInput">{t('orEnterOctal', locale)}</label>
          <input
            type="text"
            id="numericInput"
            className="numeric-input"
            value={numericInput}
            onChange={handleNumericInputChange}
            placeholder="644"
            maxLength={3}
          />
        </div>
      </div>

      <div className="info-section">
        <h2>{t('about', locale)}</h2>
        <p>{t('description', locale)}</p>
        <p>{t('tip', locale)}</p>
      </div>
    </ToolLayout>
  );
}