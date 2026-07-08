<div class="modal fade" id="modal-form-shop" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"></h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form id="form-shop">
          <input type="hidden" id="nid" name="nid">

          <div class="row mb-3">
            <div class="col-md-3">
              <label for="title" class="form-label">Tên shop</label>
              <input type="text" class="form-control" id="title" name="title" required>
            </div>
            <div class="col-md-3">
              <label for="kho_id" class="form-label">Kho</label>
              <select class="form-select" id="kho_id" name="kho_id" required>
                <option value="">-- Chọn kho --</option>
                <!-- Options load bằng JS -->
              </select>
            </div>

            <div class="col-md-3">
              <label for="field_cua_hang_id" class="form-label">Cửa hàng</label>
              <select class="form-select" id="field_cua_hang_id" name="field_cua_hang_id" required>
                <option value="">-- Chọn cửa hàng --</option>
                <!-- Options load bằng JS -->
              </select>
            </div>
          </div>

          <div class="row mb-3">

            <div class="col-md-3">
              <label for="field_username_ans" class="form-label">Username ANS</label>
              <input type="text" class="form-control" id="field_username_ans" name="field_username_ans">
            </div>

            <div class="col-md-3">
              <label for="field_username_hal" class="form-label">Username HAL</label>
              <input type="text" class="form-control" id="field_username_hal" name="field_username_hal">
            </div>

            <div class="col-md-3">
              <label for="field_id_ans" class="form-label">ID ANS</label>
              <input type="text" class="form-control" id="field_id_ans" name="field_id_ans">
            </div>

            <div class="col-md-3">
              <label for="field_pass_ans" class="form-label">Pass ANS</label>
              <input type="password" class="form-control" id="field_pass_ans" name="field_pass_ans">
            </div>

            <div class="col-md-3">
              <label for="field_pass_hal" class="form-label">Pass HAL</label>
              <input type="password" class="form-control" id="field_pass_hal" name="field_pass_hal">
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary me-2" id="btn-save-shop" tabindex="0" aria-controls="DataTables_Table_0" type="button">
            <span>
                 <span class="d-flex align-items-center gap-2">
                      <i class="icon-base ti tabler-file-arrow-right icon-sm"></i>
                      <span class="d-none d-sm-inline-block">Lưu lại</span>
                 </span>
            </span>
        </button>
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
          Đóng lại
        </button>
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-datatable table-responsive pt-0">
    <div id="block-quan-ly-shop" class="dt-container dt-bootstrap5 dt-empty-footer">
      <div class="row card-header flex-column flex-md-row border-bottom mx-0 px-3">
        <div class="col-md-2">
          <h5 class="card-title"><?php print drupal_get_title(); ?></h5>
        </div>
        <div class="col-md-10 text-end">
          <a href="#" class="btn btn-them-shop-hal-ans btn-success me-2">
            <i class="icon-base ti tabler-plus icon-sm"></i> HAL / ANS
          </a>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-bordered text-nowrap">
          <?php if (!empty($header)) : ?>
            <thead>
            <tr>
              <?php foreach ($header as $field => $label): ?>
                <th width="<?=$field == 'nothing' ? '1%' : '' ?>">
                  <?php print $label; ?>
                </th>
              <?php endforeach; ?>
            </tr>
            </thead>
          <?php endif; ?>
          <tbody class="table-border-bottom-0">
          <?php foreach ($rows as $row_count => $row): ?>
            <tr>
              <?php foreach ($row as $field => $content): ?>
                <td>
                  <?php if($field == 'nothing'): ?>
                    <div class="dropdown">
                      <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                        <i class="icon-base ti tabler-dots-vertical"></i>
                      </button>
                      <div class="dropdown-menu">
                        <a class="dropdown-item btn-sua-shop" href="#" data-value="<?=$content?>">
                          <i class="icon-base ti tabler-mood-edit me-1"></i> Sửa
                        </a>
                        <a class="dropdown-item xoa-shop" href="#" data-value="<?=$content?>">
                          <i class="icon-base ti tabler-trash me-1"></i> Xóa
                        </a>
                      </div>
                    </div>
                  <?php else: ?>
                    <?php  print $content; ?>
                  <?php endif; ?>
                </td>
              <?php endforeach; ?>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
