<div class="card">
    <div class="card-header row">
        <div class="col-md-2">
            <h5>
                <?php print drupal_get_title(); ?>
            </h5>
        </div>
        <div class="col-md-6">
        </div>
        <div class="col-md-4 text-end">
            <div>
                <a href="#" class="btn btn-success btn-them-nha-xe" data-bs-toggle="modal"
                   data-bs-target="#them-nha-xe-modal">
                    <i class="icon-base ti tabler-plus me-1"></i>
                    Thêm nhà xe
                </a>
            </div>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-bordered table-striped text-nowrap">
            <?php if (!empty($title) || !empty($caption)): ?>
                <caption><?php print $caption . $title; ?></caption>
            <?php endif; ?>
            <?php if (!empty($header)) : ?>
                <thead>
                <tr>
                    <?php foreach ($header as $field => $label): ?>
                        <th width="<?= trim($label) != 'Tên nhà xe' ? '1%' : '' ?>">
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
                        <td>
                            <?php if ($field == 'nid'): ?>
                                <div class="dropdown">
                                    <button type="button"
                                            class="btn p-0 dropdown-toggle hide-arrow"
                                            data-bs-toggle="dropdown">
                                        <i class="icon-base ti tabler-settings-spark"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        <a class="dropdown-item  btn-load-danh-muc" href="#"
                                           data-value="<?= $content ?>">
                                            <i class="icon-base ti tabler-user-edit me-1"></i>
                                            Sửa
                                        </a>
                                        <a class="dropdown-item btn-xoa-danh-muc text-danger" href="#"
                                           data-value="<?= $content ?>">
                                            <i class="icon-base ti tabler-trash me-1"></i>
                                            Xóa
                                        </a>
                                    </div>
                                </div>
                            <?php elseif ($field == 'field_nha_xe_ngoai'): ?>
                                <?php if ($content): ?>
                                    <div class="text-center text-success">
                                        <i class="icon-base ti tabler-circle-check"></i>
                                    </div>
                                <?php endif; ?>
                            <?php else: ?>
                                <?php print $content ?>
                            <?php endif; ?>
                        </td>
                    <?php endforeach; ?>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div><?php
