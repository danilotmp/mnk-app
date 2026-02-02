/**
 * Tipos TypeScript para el sistema de i18n
 * Define la estructura de las traducciones para type-safety
 */

// Estructura base de traducciones - organizadas por módulo/dominio
export interface Translations {
  common: {
    welcome: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    search: string;
    filter: string;
    actions: string;
    searchHint: string;
    all: string;
    view: string;
    create: string;
    showFilters: string;
    hideFilters: string;
    clearFilters: string;
    showingResults: (start: number, end: number, total: number) => string;
    pageInfo: (page: number, totalPages: number) => string;
    show: string;
  };

  navigation: {
    home: string;
    explore: string;
    products: string;
    services: string;
    contact: string;
    about: string;
    settings: string;
    profile: string;
    logout: string;
  };

  menu: {
    inicio: string;
    explorar: string;
    productos: string;
    cuentas: string;
    prestamos: string;
    tarjetas: string;
    masServicios: string;
    contactos: string;
    // Submenús
    productosTitle: string;
    plataformaTitle: string;
    serviciosAdministradosTitle: string;
    networkSecurity: string;
    vulnerability: string;
    pam: string;
    endpoint: string;
    insurance: string;
    threatHunting: string;
    uem: string;
    emailSecurity: string;
    xdr: string;
    mxdr: string;
    savings: string;
    checking: string;
    investments: string;
    multicredit: string;
    multicreditDesc: string;
    microcredit: string;
    microcreditDesc: string;
    casafacil: string;
    casafacilDesc: string;
    autofacil: string;
    autofacilDesc: string;
    educativo: string;
    educativoDesc: string;
    transfers: string;
    payments: string;
  };

  pages: {
    home: {
      title: string;
      welcomeMessage: string;
      description: string;
      features: string;
      step1: string;
      step1Description: string;
      step2: string;
      step2Description: string;
      step3: string;
      step3Description: string;
      exploreMore: string;
      configuration: string;
    };
    contact: {
      title: string;
      subtitle: string;
      mainPhone: string;
      mainPhoneLabel: string;
      needHelp: string;
      customerService: string;
      offices: string;
      officesSubtitle: string;
      map: string;
      contactForm: string;
      schedule: string;
      address: string;
      phone: string;
      mobile: string;
      email: string;
    };
    notFound: {
      title: string;
      message: string;
      goHome: string;
      goBack: string;
      contactUs: string;
    };
  };

  user: {
    profile: string;
    settings: string;
    logout: string;
    changeBranch: string;
    changing: string;
    myProfile: string;
    configuration: string;
  };

  language: {
    selectLanguage: string;
  };

  menuLabel: {
    menu: string;
  };

  auth: {
    login: string;
    logout: string;
    register: string;
    email: string;
    password: string;
    rememberMe: string;
    forgotPassword: string;
    signIn: string;
    signUp: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    loginSuccess: string;
    loginError: string;
    invalidCredentials: string;
    emailRequired: string;
    passwordRequired: string;
    changePassword: string;
    companyCode: string;
    companyCodePlaceholder: string;
    logoutSuccess: string;
  };

  errors: {
    generic: string;
    networkError: string;
    unauthorized: string;
    notFound: string;
    badRequest: string;
    forbidden: string;
    conflict: string;
    unprocessableEntity: string;
    tooManyRequests: string;
    serverError: string;
    serviceUnavailable: string;
    connectionTimeout: string;
    unknownError: string;
  };

  api: {
    loginSuccess: string;
    loginFailed: string;
    sessionExpired: string;
    requestFailed: string;
    networkUnavailable: string;
  };

  security?: {
    users?: {
      title: string;
      subtitle: string;
      create: string;
      edit: string;
      editShort: string;
      delete: string;
      deleteShort: string;
      activate: string;
      activateShort: string;
      deactivate: string;
      deactivateShort: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      phone: string;
      role: string;
      company: string;
      branches: string;
      status: string;
      active: string;
      inactive: string;
      pending: string;
      suspended: string;
      filterPlaceholder: string;
      searchPlaceholder: string;
      loadError: string;
      empty: string;
      activated: string;
      deactivated: string;
      deleted: string;
      deletedFilter: string;
      deletedUser: string;
      createSubtitle: string;
      editSubtitle: string;
      firstNamePlaceholder: string;
      lastNamePlaceholder: string;
      phonePlaceholder: string;
      selectCompany: string;
      selectBranches: string;
      noBranches: string;
      noRole: string;
    };
    roles?: {
      title: string;
      subtitle: string;
      create: string;
      edit: string;
      editShort: string;
      delete: string;
      deleteShort: string;
      name: string;
      code: string;
      description: string;
      permissions: string;
      filterPlaceholder: string;
      searchPlaceholder: string;
      loadError: string;
      defaultOption: string;
      defaultOptionsPlural: string;
      noPermissionsAssigned: string;
      totalPermissions: string;
      editPermissions: string;
      rolePermissions: string;
      permissionsPrefix: string;
      viewPermissions: string;
      empty: string;
      system: string;
      createSubtitle: string;
      editSubtitle: string;
      company: string;
      selectCompany: string;
      loadingCompanies: string;
      noCompaniesAvailable: string;
      systemRole: string;
      systemRoleDescription: string;
      codePlaceholder: string;
      codePlaceholderOptional: string;
      selectRole: string;
    };
    permissions?: {
      title: string;
      subtitle: string;
      show?: string;
      create: string;
      createOrEdit: string;
      createSubtitle: string;
      edit: string;
      editSubtitle: string;
      editShort: string;
      pendingChanges?: string | ((count: number) => string);
      delete: string;
      deleteShort: string;
      name: string;
      code: string;
      module: string;
      action: string;
      icon: string;
      iconPlaceholder: string;
      menuItems: string;
      selectMenuItems: string;
      selectMenuItemsSubtitle: string;
      showOnlySelected: string;
      filterPlaceholder: string;
      searchPlaceholder: string;
      loadError: string;
      preview: string;
      selectCompany: string;
      selectRole: string;
      systemPermissions: string;
      customPermissions: string;
    };
    accesses?: {
      title: string;
      subtitle: string;
      create: string;
      edit: string;
      editShort: string;
      delete: string;
      deleteShort: string;
      user: string;
      company: string;
      branch: string;
      role: string;
      permissions: string;
      filterPlaceholder: string;
      searchPlaceholder: string;
      loadError: string;
    };
    companies?: {
      title: string;
      subtitle: string;
      create: string;
      createTitle: string;
      edit: string;
      editTitle: string;
      editShort: string;
      delete: string;
      deleteShort: string;
      name: string;
      code: string;
      email: string;
      phone: string;
      description: string;
      filterPlaceholder: string;
      searchPlaceholder: string;
      loadError: string;
      empty: string;
      createSubtitle: string;
      editSubtitle: string;
      deleteConfirmTitle: string;
      deleteConfirmMessage: string;
      deletedFilter: string;
      deletedUser: string;
      codePlaceholder: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      phonePlaceholder: string;
      descriptionPlaceholder: string;
      codeRequired: string;
      nameRequired: string;
      emailInvalid: string;
      createSuccess: string;
      editSuccess: string;
      filters?: {
        all: string;
        status: string;
      };
    };
    menuAdmin?: {
      title?: string;
      subtitle?: string;
      expand: string;
      collapse: string;
      move: string;
      addItem: string;
      noUrl: string;
      dropHere: string;
      addGrouping: string;
      deleteGrouping: string;
      deleteGroupingConfirm: string;
      deleteGroupingMessage: string;
      groupingDeleted: string;
      itemsMovedToSubmenu: string;
      columnTitle: string;
      columnTitlePlaceholder: string;
      icon: string;
      iconPlaceholder: string;
      iconExample: string;
      name: string;
      namePlaceholder: string;
      url: string;
      urlPlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      status: string;
      active: string;
      inactive: string;
      deleted: string;
      pending: string;
      public: string;
      saving: string;
      save: string;
      cancel: string;
      newItem: string;
      searchPlaceholder: string;
      errorLoadingMenu: string;
      errorSavingMenu: string;
      errorOpeningIconsDoc: string;
      inactive: string;
      noItemsInMenu: string;
      changePending: string;
      changesPending: string;
      selectIcon: string;
      selectIconDescription: string;
      apply: string;
    };
  };
}

export type Language = "es" | "en";
