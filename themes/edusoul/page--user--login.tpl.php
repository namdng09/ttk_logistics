<?php
/**
 * @file
 * Login page template.
 */
?>

<div class="d-none">
  <?php if ($page['content']) print render($page['content']); ?>
</div>

<style>
  html,
  body {
    height: 100%;
    margin: 0;
  }

  .login-banner {
    height: 100vh;
    object-fit: cover;
    object-position: left;
  }

  .login-side {
    min-height: 100vh;
    position: absolute;
    right: 0;
  }

  .login-card {
    max-width: 430px;
  }

  @media (max-width: 767.98px) {
    .login-side {
      min-height: 100vh;
    }
  }
</style>

<div class="container-fluid p-0">
  <div class="row g-0 min-vh-100">
    <div class="col-md-12 d-none d-md-block" style="background-image: url('/sites/default/files/background_andinjsc.jpg'); background-size: cover; background-position: left; height: 100vh;">
    </div>

    <div class="col-12 col-md-4 login-side">
      <div class="d-flex align-items-center justify-content-center min-vh-100 p-4 p-lg-5">
        <div class="login-card w-100">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-4 p-xl-5">
              <div class="text-center mb-4">
                <div class="d-flex align-items-center justify-content-center gap-2 mb-3">
                  <span class="app-brand-text demo text-heading fw-bold login-brand-text">Tân Trường Khoa Logistics</span>
                </div>
              </div>

              <div class="mb-4">
                <p class="text-muted mb-0">Chào mừng đã trở lại!</p>
              </div>

              <?php if (!empty($messages)): ?>
                <div class="mb-4"><?php print $messages; ?></div>
              <?php endif; ?>

              <!-- Giữ nguyên các id, name, class và cách submit của giao diện cũ. -->
              <form id="formAuthentication" class="mb-0" action="#" method="GET">
                <div class="mb-3">
                  <label for="email" class="form-label fw-medium">Tên đăng nhập</label>
                  <input type="text" class="form-control form-control-lg" id="email" name="email-username" placeholder="Nhập tên đăng nhập" autocomplete="username" autofocus>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label fw-medium">Mật khẩu</label>
                  <div class="input-group input-group-lg">
                    <input type="password" id="password" class="form-control" name="password" placeholder="••••••••••••" autocomplete="current-password">
                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                      <i class="icon-base ti tabler-eye-off"></i>
                    </button>
                  </div>
                </div>

                <div class="d-flex justify-content-end mb-4">
                  <a href="#" class="text-decoration-none small">Quên mật khẩu?</a>
                </div>

                <div class="d-grid">
                  <a href="#" class="btn-login btn btn-primary btn-lg">Đăng nhập</a>
                </div>
              </form>

              <div class="text-center text-muted small mt-4">© <?php print date('Y'); ?> ANDINJSC</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  (function () {
    var btn = document.getElementById('togglePassword');
    var input = document.getElementById('password');
    if (!btn || !input) return;

    btn.addEventListener('click', function () {
      var icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
          icon.classList.remove('tabler-eye-off');
          icon.classList.add('tabler-eye');
        }
      }
      else {
        input.type = 'password';
        if (icon) {
          icon.classList.remove('tabler-eye');
          icon.classList.add('tabler-eye-off');
        }
      }
    });
  })();
</script>
