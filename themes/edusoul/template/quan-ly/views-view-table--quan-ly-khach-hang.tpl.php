<?php

/**
 * @file
 * Template to display a view as a table.
 *
 * - $title : The title of this group of rows.  May be empty.
 * - $header: An array of header labels keyed by field id.
 * - $caption: The caption for this table. May be empty.
 * - $header_classes: An array of header classes keyed by field id.
 * - $fields: An array of CSS IDs to use for each field id.
 * - $classes: A class or classes to apply to the table, based on settings.
 * - $row_classes: An array of classes to apply to each row, indexed by row
 *   number. This matches the index in $rows.
 * - $rows: An array of row items. Each row is an array of content.
 *   $rows are keyed by row number, fields within rows are keyed by field ID.
 * - $field_classes: An array of classes to apply to each field, indexed by
 *   field id, then row number. This matches the index in $rows.
 *
 * @ingroup views_templates
 */
?>
<!-- Extra Large Modal -->
<div class="modal fade" id="khach-hang-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl" role="document">
        <div class="modal-content">
            <form id="form-khach-hang">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel4"><span id="tieu-de">Sửa khách hàng</span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="nid" name="nid" value="">
                    <div class="form-group">
                        <div class="row">
                            <div class="col-md-3">
                                <label class="mb-2">Họ tên</label>
                                <input type="text" id="field_ho_ten" name="field_ho_ten" class="form-control" required>
                            </div>
                            <div class="col-md-3">
                                <label class="mb-2">Điện thoại</label>
                                <input type="text" id="field_dien_thoai" name="field_dien_thoai" class="form-control"
                                       required>
                            </div>
                            <div class="col-md-6">
                                <label class="mb-2">Địa chỉ</label>
                                <input type="text" id="field_dia_chi" name="field_dia_chi" class="form-control"
                                       required>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                        Đóng lại
                    </button>
                    <a href="#" class="btn btn-primary btn-luu-khach-hang">
                       Lưu
                    </a>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <div class="row">
            <div class="col-md-4">
                <h5><?php print drupal_get_title(); ?></h5>
            </div>
            <div class="col-md-8 text-end">
                <a class="btn btn-success waves-effect waves-light" href="/quan-ly/them-khach-hang">
                    <i class="icon-base ti tabler-plus me-1"></i> Thêm mới
                </a>
            </div>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table table-bordered table-striped text-nowrap">
            <?php if (!empty($title) || !empty($caption)): ?>
                <caption><?php print $caption . $title; ?></caption>
            <?php endif; ?>
            <?php if (!empty($header)) : ?>
                <thead>
                <tr>
                    <?php foreach ($header as $field => $label): ?>
                        <th width="<?= $field == 'nid' ? '1%' : '' ?>">
                            <?php print $label; ?>
                        </th>
                    <?php endforeach; ?>
                </tr>
                </thead>
            <?php endif; ?>
            <tbody>
            <?php foreach ($rows as $row_count => $row): ?>
                <tr>
                    <?php foreach ($row as $field => $content): ?>
                        <?php if ($field == 'nid'): ?>
                            <td class="text-center">
                                <div class="dropdown">
                                    <button type="button"
                                            class="btn p-0 dropdown-toggle hide-arrow"
                                            data-bs-toggle="dropdown">
                                        <i class="icon-base ti tabler-settings-spark"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        <a class="dropdown-item btn-load-khach-hang" href="#"
                                           data-value="<?= $content ?>">
                                            <i class="icon-base ti tabler-user-edit me-1"></i>
                                            Sửa
                                        </a>
                                        <a class="dropdown-item btn-xoa-khach-hang text-danger" href="#"
                                           data-value="<?= $content ?>">
                                            <i class="icon-base ti tabler-trash me-1"></i>
                                            Xóa
                                        </a>
                                    </div>
                                </div>
                            </td>
                        <?php else: ?>
                            <td>
                                <?php print $content ?>
                            </td>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
